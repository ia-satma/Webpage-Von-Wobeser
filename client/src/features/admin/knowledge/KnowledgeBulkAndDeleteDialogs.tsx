import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { AGENT_TYPES, KNOWLEDGE_CATEGORIES } from "./catalogs";
import type { KnowledgeAdminModel } from "./useKnowledgeAdmin";

export function KnowledgeBulkAndDeleteDialogs({ model }: { model: KnowledgeAdminModel }) {
  const {
    t,
    bulkForm,
    isBulkModalOpen,
    setIsBulkModalOpen,
    bulkUploadMutation,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedDocument,
    deleteMutation,
  } = model;

  return (
    <>
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
                              <SelectItem key={agent.value} value={agent.value}>{(t as any)[agent.labelKey] || (agent as any).label || agent.value}</SelectItem>
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
    </>
  );
}
