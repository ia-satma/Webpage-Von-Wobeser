import { useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { AttorneyOrderPanel } from "@/features/admin/team-order/AttorneyOrderPanel";
import { 
  Search, 
  Pencil, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  UserPlus
} from "lucide-react";
import type { TeamMember } from "@shared/schema";
import { getAttorneyPublicName } from "@shared/attorneyName";

const translations = {
  en: {
    title: "Team Members",
    back: "Back to Dashboard",
    search: "Search by name or email...",
    filterRole: "Filter by role",
    all: "All",
    partner: "Partner",
    ofCounsel: "Of Counsel",

    associate: "Associate",
    name: "Name",
    role: "Role",
    email: "Email",
    actions: "Actions",
    noMembers: "No team members found",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    addMember: "Add Member",
    confirmDelete: "Are you sure you want to delete this team member?",
    deleteSuccess: "Team member deleted successfully",
    deleteError: "Failed to delete team member",
    page: "Page",
    of: "of",
    loading: "Loading...",
    totalMembers: "Total Members",
    partners: "Partners",
    associates: "Associates",
    createNew: "Create New Member",
  },
  es: {
    title: "Abogados y equipo",
    back: "Volver al Dashboard",
    search: "Buscar por nombre o correo...",
    filterRole: "Filtrar por rol",
    all: "Todos",
    partner: "Socio",
    ofCounsel: "Of Counsel",

    associate: "Asociado",
    name: "Nombre",
    role: "Rol",
    email: "Correo",
    actions: "Acciones",
    noMembers: "No se encontraron miembros del equipo",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    addMember: "Agregar Miembro",
    confirmDelete: "¿Está seguro que desea eliminar este miembro del equipo?",
    deleteSuccess: "Miembro eliminado exitosamente",
    deleteError: "Error al eliminar miembro",
    page: "Página",
    of: "de",
    loading: "Cargando...",
    totalMembers: "Total Miembros",
    partners: "Socios",
    associates: "Asociados",
    createNew: "Crear Nuevo Miembro",
  },
  de: {
    title: "Teammitglieder",
    back: "Zurück zum Dashboard",
    search: "Nach Name oder E-Mail suchen...",
    filterRole: "Nach Rolle filtern",
    all: "Alle",
    partner: "Partner",
    ofCounsel: "Of Counsel",

    associate: "Associate",
    name: "Name",
    role: "Rolle",
    email: "E-Mail",
    actions: "Aktionen",
    noMembers: "Keine Teammitglieder gefunden",
    edit: "Bearbeiten",
    delete: "Löschen",
    view: "Ansehen",
    addMember: "Mitglied hinzufügen",
    confirmDelete: "Sind Sie sicher, dass Sie dieses Teammitglied löschen möchten?",
    deleteSuccess: "Teammitglied erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen des Teammitglieds",
    page: "Seite",
    of: "von",
    loading: "Wird geladen...",
    totalMembers: "Gesamt Mitglieder",
    partners: "Partner",
    associates: "Anwälte",
    createNew: "Neues Mitglied erstellen",
  },
  zh: {
    title: "团队成员",
    back: "返回仪表板",
    search: "按姓名或邮箱搜索...",
    filterRole: "按角色筛选",
    all: "全部",
    partner: "合伙人",
    ofCounsel: "顾问律师",
    associate: "助理律师",
    name: "姓名",
    role: "职位",
    email: "邮箱",
    actions: "操作",
    noMembers: "未找到团队成员",
    edit: "编辑",
    delete: "删除",
    view: "查看",
    addMember: "添加成员",
    confirmDelete: "您确定要删除此团队成员吗？",
    deleteSuccess: "团队成员删除成功",
    deleteError: "删除团队成员失败",
    page: "页",
    of: "/",
    loading: "加载中...",
    totalMembers: "成员总数",
    partners: "合伙人",
    associates: "助理律师",
    createNew: "创建新成员",
  },
  ko: {
    title: "팀 구성원",
    back: "대시보드로 돌아가기",
    search: "이름 또는 이메일로 검색...",
    filterRole: "역할별 필터",
    all: "전체",
    partner: "파트너",
    ofCounsel: "Of Counsel",

    associate: "어소시에이트",
    name: "이름",
    role: "직위",
    email: "이메일",
    actions: "작업",
    noMembers: "팀 구성원을 찾을 수 없습니다",
    edit: "편집",
    delete: "삭제",
    view: "보기",
    addMember: "구성원 추가",
    confirmDelete: "이 팀 구성원을 삭제하시겠습니까?",
    deleteSuccess: "팀 구성원이 성공적으로 삭제되었습니다",
    deleteError: "팀 구성원 삭제 실패",
    page: "페이지",
    of: "/",
    loading: "로딩 중...",
    totalMembers: "전체 구성원",
    partners: "파트너",
    associates: "어소시에이트",
    createNew: "새 구성원 만들기",
  },
  ja: {
    title: "チームメンバー",
    back: "ダッシュボードに戻る",
    search: "名前またはメールで検索...",
    filterRole: "役職でフィルター",
    all: "すべて",
    partner: "パートナー",
    ofCounsel: "オブカウンセル",
    associate: "アソシエイト",
    name: "名前",
    role: "役職",
    email: "メール",
    actions: "アクション",
    noMembers: "チームメンバーが見つかりません",
    edit: "編集",
    delete: "削除",
    view: "表示",
    addMember: "メンバー追加",
    confirmDelete: "このチームメンバーを削除してもよろしいですか？",
    deleteSuccess: "チームメンバーが正常に削除されました",
    deleteError: "チームメンバーの削除に失敗しました",
    page: "ページ",
    of: "/",
    loading: "読み込み中...",
    totalMembers: "総メンバー",
    partners: "パートナー",
    associates: "アソシエイト",
    createNew: "新規メンバー作成",
  },
  ar: {
    title: "أعضاء الفريق",
    back: "العودة إلى لوحة التحكم",
    search: "البحث بالاسم أو البريد...",
    filterRole: "تصفية حسب الدور",
    all: "الكل",
    partner: "شريك",
    ofCounsel: "مستشار",
    associate: "محامٍ مساعد",
    name: "الاسم",
    role: "الدور",
    email: "البريد",
    actions: "الإجراءات",
    noMembers: "لم يتم العثور على أعضاء الفريق",
    edit: "تحرير",
    delete: "حذف",
    view: "عرض",
    addMember: "إضافة عضو",
    confirmDelete: "هل أنت متأكد من أنك تريد حذف عضو الفريق هذا؟",
    deleteSuccess: "تم حذف عضو الفريق بنجاح",
    deleteError: "فشل في حذف عضو الفريق",
    page: "صفحة",
    of: "من",
    loading: "جاري التحميل...",
    totalMembers: "إجمالي الأعضاء",
    partners: "الشركاء",
    associates: "المحامون المساعدون",
    createNew: "إنشاء عضو جديد",
  },
  ru: {
    title: "Члены команды",
    back: "Назад к панели",
    search: "Поиск по имени или email...",
    filterRole: "Фильтр по роли",
    all: "Все",
    partner: "Партнёр",
    ofCounsel: "Of Counsel",

    associate: "Ассоциат",
    name: "Имя",
    role: "Должность",
    email: "Email",
    actions: "Действия",
    noMembers: "Члены команды не найдены",
    edit: "Редактировать",
    delete: "Удалить",
    view: "Просмотр",
    addMember: "Добавить члена",
    confirmDelete: "Вы уверены, что хотите удалить этого члена команды?",
    deleteSuccess: "Член команды успешно удалён",
    deleteError: "Не удалось удалить члена команды",
    page: "Страница",
    of: "из",
    loading: "Загрузка...",
    totalMembers: "Всего членов",
    partners: "Партнёры",
    associates: "Ассоциаты",
    createNew: "Создать нового члена",
  },
  fr: {
    title: "Membres de l'équipe",
    back: "Retour au tableau de bord",
    search: "Rechercher par nom ou email...",
    filterRole: "Filtrer par rôle",
    all: "Tous",
    partner: "Associé",
    ofCounsel: "Of Counsel",

    associate: "Collaborateur",
    name: "Nom",
    role: "Rôle",
    email: "Email",
    actions: "Actions",
    noMembers: "Aucun membre trouvé",
    edit: "Modifier",
    delete: "Supprimer",
    view: "Voir",
    addMember: "Ajouter un membre",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce membre ?",
    deleteSuccess: "Membre supprimé avec succès",
    deleteError: "Échec de la suppression du membre",
    page: "Page",
    of: "sur",
    loading: "Chargement...",
    totalMembers: "Total membres",
    partners: "Associés",
    associates: "Collaborateurs",
    createNew: "Créer un nouveau membre",
  },
  it: {
    title: "Membri del team",
    back: "Torna alla dashboard",
    search: "Cerca per nome o email...",
    filterRole: "Filtra per ruolo",
    all: "Tutti",
    partner: "Partner",
    ofCounsel: "Of Counsel",

    associate: "Associato",
    name: "Nome",
    role: "Ruolo",
    email: "Email",
    actions: "Azioni",
    noMembers: "Nessun membro trovato",
    edit: "Modifica",
    delete: "Elimina",
    view: "Vedi",
    addMember: "Aggiungi membro",
    confirmDelete: "Sei sicuro di voler eliminare questo membro?",
    deleteSuccess: "Membro eliminato con successo",
    deleteError: "Impossibile eliminare il membro",
    page: "Pagina",
    of: "di",
    loading: "Caricamento...",
    totalMembers: "Totale membri",
    partners: "Partner",
    associates: "Associati",
    createNew: "Crea nuovo membro",
  },
};

interface TeamResponse {
  members: TeamMember[];
  total: number;
  page: number;
  totalPages: number;
}

interface TeamStats {
  total: number;
  partners: number;
  ofCounsel: number;
  counsel: number;
  associates: number;
  published: number;
  unpublished: number;
}

export default function AdminTeam() {
  const { language } = useLanguage();
  const { token, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const visibilityCopy = language === "es"
    ? { column: "Visibilidad", visible: "Publicado", hidden: "Oculto", show: "Mostrar", hide: "Ocultar", success: "Visibilidad actualizada", error: "No se pudo actualizar la visibilidad", counsel: "Consejeros" }
    : { column: "Visibility", visible: "Published", hidden: "Hidden", show: "Show", hide: "Hide", success: "Visibility updated", error: "Could not update visibility", counsel: "Counsel" };

  const { data, isLoading, isError, error, refetch } = useQuery<TeamResponse>({
    queryKey: ["/api/admin/team", { search, role: roleFilter, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter,
      });
      const response = await adminApiRequest("GET", `/api/admin/team?${params}`);
      if (!response.ok) throw new Error("No se pudo cargar la lista de abogados.");
      return response.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const { data: stats } = useQuery<TeamStats>({
    queryKey: ["/api/admin/team/stats"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/team/stats");
      if (!response.ok) throw new Error("No se pudieron cargar las estadísticas de abogados.");
      return response.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApiRequest("DELETE", `/api/admin/team/${id}`);
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const publishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const response = await adminApiRequest("PUT", `/api/admin/team/${id}`, { published });
      if (!response.ok) throw new Error("Failed to update visibility");
      return response.json() as Promise<TeamMember>;
    },
    onSuccess: () => {
      toast({ title: visibilityCopy.success });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team/stats"] });
    },
    onError: () => {
      toast({ title: visibilityCopy.error, variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadgeVariant = (title: string): "default" | "secondary" | "outline" => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("partner")) return "default";
    if (titleLower.includes("counsel")) return "secondary";
    return "outline";
  };

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

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={t.title}
          icon={Users}
          actions={
            <Link href="/admin/team/new">
              <Button data-testid="button-add-member">
                <UserPlus className="w-4 h-4 mr-2" />
                {t.addMember}
              </Button>
            </Link>
          }
        />

        <AdminPageHelp pageId="equipo" manualSectionId="equipo">Aquí administras a los abogados y el equipo: agrega, edita y sube su foto. Puedes asignar a cada uno varias áreas de práctica e industrias.</AdminPageHelp>
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">{t.totalMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.partners}</div>
                <div className="text-sm text-muted-foreground">{t.partners}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.ofCounsel}</div>
                <div className="text-sm text-muted-foreground">{t.ofCounsel}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.counsel}</div>
                <div className="text-sm text-muted-foreground">{visibilityCopy.counsel}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.associates}</div>
                <div className="text-sm text-muted-foreground">{t.associates}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-role">
                  <SelectValue placeholder={t.filterRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="partner">{t.partner}</SelectItem>
                  <SelectItem value="of counsel">{t.ofCounsel}</SelectItem>
                  <SelectItem value="counsel">{visibilityCopy.counsel}</SelectItem>
                  <SelectItem value="associate">{t.associate}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-destructive">{error instanceof Error ? error.message : "No se pudo cargar la lista de abogados."}</p>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>Reintentar</Button>
              </div>
            ) : data?.members && data.members.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">{t.name}</TableHead>
                      <TableHead>{t.role}</TableHead>
                      <TableHead>{t.email}</TableHead>
                      <TableHead>{visibilityCopy.column}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.members.map((member) => {
                      const publicName = getAttorneyPublicName(member);
                      return <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.imageUrl || undefined} alt={publicName} />
                              <AvatarFallback>{getInitials(publicName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{publicName}</div>
                              <div className="text-sm text-muted-foreground">
                                {language === "es" ? member.titleEs : member.title}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.title)}>
                            {language === "es" ? member.roleEs : member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={member.published !== false}
                              onCheckedChange={(published) => publishedMutation.mutate({ id: member.id, published })}
                              disabled={publishedMutation.isPending}
                              aria-label={`${member.published === false ? visibilityCopy.show : visibilityCopy.hide} ${publicName}`}
                              data-testid={`switch-member-published-${member.id}`}
                            />
                            <Badge variant={member.published === false ? "secondary" : "outline"} className={member.published === false ? "" : "border-emerald-600/30 bg-emerald-50 text-emerald-700"}>
                              {member.published === false ? visibilityCopy.hidden : visibilityCopy.visible}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {/* Perfil público del abogado servido por el espejo (Express).
                                La ruta correcta es /abogado/:slug (no /team/:slug, que no existe)
                                y se usa <a> nativo, no <Link> de wouter, para pegarle al servidor. */}
                            <a href={`/abogado/${member.slug}`} target="_blank" rel="noopener noreferrer">
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-view-${member.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </a>
                            <Link href={`/admin/team/${member.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-edit-${member.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(member.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${member.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>;
                    })}
                  </TableBody>
                </Table>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t.page} {data.page} {t.of} {data.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noMembers}</p>
                <Link href="/admin/team/new">
                  <Button className="mt-4" data-testid="button-create-first">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.createNew}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-8">
          <AttorneyOrderPanel language={language} />
        </div>
      </main>
    </div>
  );
}
