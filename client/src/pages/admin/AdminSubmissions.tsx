import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, FileText, Download, Check } from "lucide-react";

type ContactSubmissionRow = {
  id: string; fullName: string; email: string; phone: string | null; company: string | null;
  practiceArea: string | null; message: string; submittedAt: string | null; read: boolean | null;
};

type CareerApplicationRow = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; address: string | null;
  cvPath: string; cvOriginalName: string | null; submittedAt: string | null; read: boolean | null;
};

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminSubmissions() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const contactQuery = useQuery<ContactSubmissionRow[]>({
    queryKey: ["/api/admin/contact-submissions"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/contact-submissions");
      if (!res.ok) throw new Error("No se pudo cargar los mensajes de contacto.");
      return res.json();
    },
  });

  const careerQuery = useQuery<CareerApplicationRow[]>({
    queryKey: ["/api/admin/career-applications"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/career-applications");
      if (!res.ok) throw new Error("No se pudo cargar las solicitudes de pasantías.");
      return res.json();
    },
  });

  const markContactRead = async (id: string) => {
    const res = await adminApiRequest("PATCH", `/api/admin/contact-submissions/${id}/read`);
    if (res.ok) {
      toast({ title: "Marcado como leído" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-submissions"] });
    } else {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const markCareerRead = async (id: string) => {
    const res = await adminApiRequest("PATCH", `/api/admin/career-applications/${id}/read`);
    if (res.ok) {
      toast({ title: "Marcado como leído" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/career-applications"] });
    } else {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const unreadContact = (contactQuery.data || []).filter((c) => !c.read).length;
  const unreadCareer = (careerQuery.data || []).filter((c) => !c.read).length;

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Button></Link>
            <h1 className="text-2xl font-semibold mt-2">Solicitudes recibidas</h1>
            <p className="text-sm text-muted-foreground">Mensajes de contacto y solicitudes de pasantías enviadas desde el sitio.</p>
          </div>
        </div>

        <Tabs defaultValue="contact">
          <TabsList>
            <TabsTrigger value="contact">
              <Mail className="h-4 w-4 mr-1" /> Contacto {unreadContact > 0 && <Badge className="ml-2">{unreadContact}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="career">
              <FileText className="h-4 w-4 mr-1" /> Pasantes {unreadCareer > 0 && <Badge className="ml-2">{unreadCareer}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes de contacto</CardTitle>
                <CardDescription>Enviados desde el formulario de "Contacto" del sitio público.</CardDescription>
              </CardHeader>
              <CardContent>
                {contactQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : !contactQuery.data?.length ? (
                  <p className="text-sm text-muted-foreground">Aún no hay mensajes de contacto.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactQuery.data.map((c) => (
                        <TableRow key={c.id} className={c.read ? "opacity-60" : ""}>
                          <TableCell className="whitespace-nowrap text-sm">{fmtDate(c.submittedAt)}</TableCell>
                          <TableCell>{c.fullName}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.practiceArea || "—"}</TableCell>
                          <TableCell className="max-w-xs truncate" title={c.message}>{c.message}</TableCell>
                          <TableCell>
                            {!c.read && (
                              <Button variant="ghost" size="sm" onClick={() => markContactRead(c.id)}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Marcar leído
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="career">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de pasantías</CardTitle>
                <CardDescription>Enviadas desde el formulario de "Pasantes" del sitio público.</CardDescription>
              </CardHeader>
              <CardContent>
                {careerQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : !careerQuery.data?.length ? (
                  <p className="text-sm text-muted-foreground">Aún no hay solicitudes de pasantías.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>CV</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {careerQuery.data.map((c) => (
                        <TableRow key={c.id} className={c.read ? "opacity-60" : ""}>
                          <TableCell className="whitespace-nowrap text-sm">{fmtDate(c.submittedAt)}</TableCell>
                          <TableCell>{c.firstName} {c.lastName}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.phone || "—"}</TableCell>
                          <TableCell>
                            <a href={c.cvPath} download target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                              <Download className="h-3.5 w-3.5 mr-1" /> {c.cvOriginalName || "CV"}
                            </a>
                          </TableCell>
                          <TableCell>
                            {!c.read && (
                              <Button variant="ghost" size="sm" onClick={() => markCareerRead(c.id)}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Marcar leído
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
