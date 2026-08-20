import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { AGENT_TYPES, KNOWLEDGE_CATEGORIES, LANGUAGE_OPTIONS } from "./catalogs";
import { KnowledgeGovernanceFields } from "./KnowledgeGovernanceFields";
import type { KnowledgeAdminModel } from "./useKnowledgeAdmin";

export function KnowledgeDocumentDialogs({ model }: { model: KnowledgeAdminModel }) {
  const {
    t,
    form,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedDocument,
    createMutation,
    updateMutation,
  } = model;

  return (
    <>
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
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.titleKey}</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={(event) => {
                          field.onChange(event);
                          form.setValue("aiUseConfirmed", false);
                        }} placeholder={t.titlePlaceholder} data-testid="input-add-title" />
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
                          onChange={(event) => {
                            field.onChange(event);
                            form.setValue("aiUseConfirmed", false);
                          }}
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
                        <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-language">
                              <SelectValue placeholder={t.selectLanguage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.none}</SelectItem>
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
                <KnowledgeGovernanceFields
                  control={form.control}
                  setValue={form.setValue}
                  testIdPrefix="add"
                  label="Clasificación obligatoria"
                  confirmation="Confirmo que el documento no contiene datos personales, información confidencial ni comunicaciones privilegiadas."
                />
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
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.titleKey}</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={(event) => {
                          field.onChange(event);
                          form.setValue("aiUseConfirmed", false);
                        }} data-testid="input-edit-title" />
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
                          onChange={(event) => {
                            field.onChange(event);
                            form.setValue("aiUseConfirmed", false);
                          }}
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
                        <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-language">
                              <SelectValue placeholder={t.selectLanguage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.none}</SelectItem>
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
                <KnowledgeGovernanceFields
                  control={form.control}
                  setValue={form.setValue}
                  testIdPrefix="edit"
                  label="Clasificación obligatoria"
                  confirmation="Confirmo que revisé esta versión y puede utilizarse como contexto de los agentes."
                />
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
    </>
  );
}
