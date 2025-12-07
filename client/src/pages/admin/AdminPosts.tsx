import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Search, 
  Pencil, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

const translations = {
  en: {
    title: "Blog Posts",
    back: "Back to Dashboard",
    newPost: "New Post",
    search: "Search by title...",
    filterStatus: "Filter by status",
    all: "All",
    draft: "Draft",
    published: "Published",
    trash: "Trash",
    titleColumn: "Title",
    author: "Author",
    date: "Date",
    status: "Status",
    actions: "Actions",
    noPosts: "No posts found",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    confirmDelete: "Are you sure you want to delete this post?",
    deleteSuccess: "Post deleted successfully",
    deleteError: "Failed to delete post",
    page: "Page",
    of: "of",
    loading: "Loading...",
  },
  es: {
    title: "Posts del Blog",
    back: "Volver al Dashboard",
    newPost: "Nuevo Post",
    search: "Buscar por título...",
    filterStatus: "Filtrar por estado",
    all: "Todos",
    draft: "Borrador",
    published: "Publicado",
    trash: "Papelera",
    titleColumn: "Título",
    author: "Autor",
    date: "Fecha",
    status: "Estado",
    actions: "Acciones",
    noPosts: "No se encontraron posts",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    confirmDelete: "¿Está seguro que desea eliminar este post?",
    deleteSuccess: "Post eliminado exitosamente",
    deleteError: "Error al eliminar el post",
    page: "Página",
    of: "de",
    loading: "Cargando...",
  },
};

interface PostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminPosts() {
  const { language, displayLanguage } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[displayLanguage];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const postsQuery = useQuery<PostsResponse>({
    queryKey: ["/api/admin/posts", { search, status: statusFilter, page, limit: ITEMS_PER_PAGE }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      
      const res = await adminApiRequest("GET", `/api/admin/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleDelete = (postId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(postId);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(displayLanguage === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: t.draft },
      published: { variant: "default", label: t.published },
      trash: { variant: "destructive", label: t.trash },
    };
    const config = statusMap[status] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  const data = postsQuery.data || { posts: [], total: 0, page: 1, totalPages: 1 };

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
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <Link href="/admin/posts/new">
              <Button data-testid="button-new-post">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.newPost}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder={t.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-status-all">{t.all}</SelectItem>
                  <SelectItem value="draft" data-testid="option-status-draft">{t.draft}</SelectItem>
                  <SelectItem value="published" data-testid="option-status-published">{t.published}</SelectItem>
                  <SelectItem value="trash" data-testid="option-status-trash">{t.trash}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {postsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data.posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-posts">
                {t.noPosts}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.titleColumn}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.posts.map((post) => (
                      <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                        <TableCell className="font-medium" data-testid={`text-title-${post.id}`}>
                          {displayLanguage === "es" ? post.titleEs : post.title}
                        </TableCell>
                        <TableCell data-testid={`text-date-${post.id}`}>
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${post.id}`}>
                          {getStatusBadge(post.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {post.status === "published" && (
                              <Link href={`/news/${post.slug}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  data-testid={`button-view-${post.id}`}
                                  title={t.view}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`button-edit-${post.id}`}
                                title={t.edit}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(post.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${post.id}`}
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

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                      {t.page} {data.page} {t.of} {data.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
