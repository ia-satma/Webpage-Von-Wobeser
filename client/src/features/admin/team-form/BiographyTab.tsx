import type { UseFormReturn } from "react-hook-form";
import { FileText, Globe, Sparkles } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import type { Affiliation, Education, Publication, Ranking } from "@shared/schema";
import type { TeamFormCopy, TeamMemberFormData } from "./contracts";
import { ProfileCollection } from "./ProfileCollection";

export function BiographyTab({ form, t, language, memberId, watchedValues }: {
  form: UseFormReturn<TeamMemberFormData>;
  t: TeamFormCopy;
  language: string;
  memberId?: string;
  watchedValues: TeamMemberFormData;
}) {
  return (
                    <TabsContent value="bio" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.biography}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.biographyDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="bioIntro"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-[#878A8E]" />Introduction (English)</FormLabel>
                                <FormControl><RichTextEditor value={field.value ?? ""} onChange={field.onChange} rows={4} placeholder="Short editorial introduction…" recommendedFamily="gelasio" data-testid="textarea-bio-intro" /></FormControl>
                                <TypographyFieldControl entityType="team_member" entityId={memberId} field="bioIntro" language="en" role="editorial" compact />
                                <FormDescription className="text-[#878A8E] text-xs">Destacado del perfil. Presiona Enter para crear párrafos; se conservan negritas, cursivas y listas.</FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bioIntroEs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-[#878A8E]" />Introducción (español)</FormLabel>
                                <FormControl><RichTextEditor value={field.value ?? ""} onChange={field.onChange} rows={4} placeholder="Introducción editorial breve…" recommendedFamily="gelasio" data-testid="textarea-bio-intro-es" /></FormControl>
                                <TypographyFieldControl entityType="team_member" entityId={memberId} field="bioIntroEs" language="es" role="editorial" compact />
                              </FormItem>
                            )}
                          />
                          <Separator className="bg-[#D9D8D7]" />
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-[#878A8E]" />
                                  {t.bio}
                                </FormLabel>
                                <FormControl>
                                  <RichTextEditor
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    rows={8}
                                    placeholder="Professional experience, education, notable cases..."
                                    recommendedFamily="inter"
                                    data-testid="textarea-bio"
                                  />
                                </FormControl>
                                <TypographyFieldControl entityType="team_member" entityId={memberId} field="bio" language="en" role="body" compact />
                                <FormDescription className="text-[#878A8E] text-xs">
                                  {t.bioHint}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator className="bg-[#D9D8D7]" />

                          <FormField
                            control={form.control}
                            name="bioEs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-[#878A8E]" />
                                  {t.bioEs}
                                </FormLabel>
                                <FormControl>
                                  <RichTextEditor
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    rows={8}
                                    placeholder="Experiencia profesional, educación, casos notables..."
                                    recommendedFamily="inter"
                                    data-testid="textarea-bio-es"
                                  />
                                </FormControl>
                                <TypographyFieldControl entityType="team_member" entityId={memberId} field="bioEs" language="es" role="body" compact />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator className="bg-[#D9D8D7]" />
                          <ProfileCollection
                            title="Educación y experiencia"
                            description="Una fila por grado, institución o hito profesional; cada campo conserva sus versiones bilingües."
                            items={(watchedValues.education || []) as Array<Record<string, unknown>>}
                            fields={[{ key: "degree", label: "Grado / EN" }, { key: "degreeEs", label: "Grado / ES" }, { key: "school", label: "Institución / EN" }, { key: "schoolEs", label: "Institución / ES" }, { key: "year", label: "Año" }]}
                            create={() => ({ degree: "", degreeEs: "", school: "", schoolEs: "", year: "" })}
                            onChange={(education) => form.setValue("education", education as unknown as Education[], { shouldDirty: true })}
                          />
                          <ProfileCollection
                            title="Afiliaciones y actividades académicas"
                            description="Organización y cargo, en inglés y español."
                            items={(watchedValues.affiliations || []) as Array<Record<string, unknown>>}
                            fields={[{ key: "organization", label: "Organización / EN" }, { key: "organizationEs", label: "Organización / ES" }, { key: "role", label: "Cargo / EN" }, { key: "roleEs", label: "Cargo / ES" }]}
                            create={() => ({ organization: "", organizationEs: "", role: "", roleEs: "" })}
                            onChange={(affiliations) => form.setValue("affiliations", affiliations as unknown as Affiliation[], { shouldDirty: true })}
                          />
                          <ProfileCollection
                            title="Reconocimientos"
                            description="Directorio, reconocimiento, área y año."
                            items={(watchedValues.rankings || []) as Array<Record<string, unknown>>}
                            fields={[{ key: "publication", label: "Directorio" }, { key: "ranking", label: "Reconocimiento / EN" }, { key: "rankingEs", label: "Reconocimiento / ES" }, { key: "area", label: "Área / EN" }, { key: "areaEs", label: "Área / ES" }, { key: "year", label: "Año" }]}
                            create={() => ({ publication: "", ranking: "", rankingEs: "", area: "", areaEs: "", year: "" })}
                            onChange={(rankings) => form.setValue("rankings", rankings as unknown as Ranking[], { shouldDirty: true })}
                          />
                          <ProfileCollection
                            title="Noticias y artículos"
                            description="Clasifica cada recurso como noticia o artículo. La liga admite una ruta interna o URL oficial segura."
                            items={(watchedValues.publications || []) as Array<Record<string, unknown>>}
                            fields={[{ key: "kind", label: "Tipo", options: [{ value: "news", label: "Noticia" }, { value: "article", label: "Artículo" }] }, { key: "title", label: "Título / EN" }, { key: "titleEs", label: "Título / ES" }, { key: "journal", label: "Medio" }, { key: "year", label: "Año" }, { key: "url", label: "Liga" }]}
                            create={() => ({ kind: "article", title: "", titleEs: "", journal: "", year: "", url: "" })}
                            onChange={(publications) => form.setValue("publications", publications as unknown as Publication[], { shouldDirty: true })}
                          />
                          <ProfileCollection
                            title="Idiomas"
                            description="Registra cada idioma en sus variantes inglesa y española."
                            items={Array.from({ length: Math.max((watchedValues.languages || []).length, (watchedValues.languagesEs || []).length) }, (_, index) => ({ language: watchedValues.languages?.[index] || "", languageEs: watchedValues.languagesEs?.[index] || "" }))}
                            fields={[{ key: "language", label: "Idioma / EN" }, { key: "languageEs", label: "Idioma / ES" }]}
                            create={() => ({ language: "", languageEs: "" })}
                            onChange={(languages) => {
                              form.setValue("languages", languages.map((item) => String(item.language || "")).filter(Boolean), { shouldDirty: true });
                              form.setValue("languagesEs", languages.map((item) => String(item.languageEs || "")).filter(Boolean), { shouldDirty: true });
                            }}
                          />

                          {/* AI Translation hint */}
                          <div className="flex items-center gap-3 p-4 bg-[#F0F7FF] border border-[#CCE0FF]">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-800">
                              {language === "es"
                                ? "Consejo: Nuestros agentes de IA pueden traducir automáticamente las biografías a los 10 idiomas soportados."
                                : "Tip: Our AI agents can automatically translate biographies to all 10 supported languages."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
  );
}
