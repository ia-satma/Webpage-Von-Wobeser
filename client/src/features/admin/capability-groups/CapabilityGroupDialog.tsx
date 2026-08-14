import { PlusCircle } from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { CapabilityGroupsController } from "./useCapabilityGroups";

export function CapabilityGroupDialog({ controller }: { controller: CapabilityGroupsController }) {
  const {
    isDialogOpen,
    handleOpenChange,
    config,
    t,
    editingGroup,
    form,
    submit,
    handleNameChange,
    saveMutation,
  } = controller;
  return (
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button data-testid={config.newButtonTestId}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.newGroup}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">
                    {editingGroup ? t.editGroup : t.newGroup}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                    <div className="flex justify-end">
                      <TranslateButton
                        getSource={() => ({ name: form.getValues("nameEs"), description: form.getValues("descriptionEs"), fullDescription: form.getValues("fullDescriptionEs") })}
                        onApply={(f) => {
                          if (f.name != null) form.setValue("name", f.name, { shouldDirty: true });
                          if (f.description != null) form.setValue("description", f.description, { shouldDirty: true });
                          if (f.fullDescription != null) form.setValue("fullDescription", f.fullDescription, { shouldDirty: true });
                        }}
                      />
                    </div>
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
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="name" language="en" role="editorial" compact />
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
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="nameEs" language="es" role="editorial" compact />
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
                              <RichTextEditor
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder={t.descriptionEnPlaceholder}
                                rows={3}
                                recommendedFamily="gelasio"
                                data-testid="input-description-en"
                              />
                            </FormControl>
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="description" language="en" role="editorial" />
                            <FormDescription>Presiona Enter para iniciar un párrafo nuevo. El sitio conserva la tipografía editorial automáticamente.</FormDescription>
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
                              <RichTextEditor
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder={t.descriptionEsPlaceholder}
                                rows={3}
                                recommendedFamily="gelasio"
                                data-testid="input-description-es"
                              />
                            </FormControl>
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="descriptionEs" language="es" role="editorial" />
                            <FormDescription>Presiona Enter para iniciar un párrafo nuevo. El sitio conserva la tipografía editorial automáticamente.</FormDescription>
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
                              <RichTextEditor
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder={t.fullDescriptionEnPlaceholder}
                                rows={4}
                                recommendedFamily="inter"
                                data-testid="input-full-description-en"
                              />
                            </FormControl>
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="fullDescription" language="en" role="body" />
                            <FormDescription>Usa un párrafo por bloque de contenido; las negritas, cursivas y listas se conservan al publicar.</FormDescription>
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
                              <RichTextEditor
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder={t.fullDescriptionEsPlaceholder}
                                rows={4}
                                recommendedFamily="inter"
                                data-testid="input-full-description-es"
                              />
                            </FormControl>
                            <TypographyFieldControl entityType={config.entityType} entityId={editingGroup?.id} field="fullDescriptionEs" language="es" role="body" />
                            <FormDescription>Usa un párrafo por bloque de contenido; las negritas, cursivas y listas se conservan al publicar.</FormDescription>
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

                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Visible en el sitio</FormLabel>
                              <FormDescription>Si lo apagas, se oculta del sitio público (sin eliminarlo).</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-published" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagen del carrusel</FormLabel>
                            <FormDescription>{config.imageDescription}</FormDescription>
                            <FormControl>
                              <ImageUpload value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
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
  );
}
