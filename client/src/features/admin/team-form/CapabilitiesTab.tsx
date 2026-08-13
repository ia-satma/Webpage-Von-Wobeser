import type { UseFormReturn } from "react-hook-form";
import { Briefcase, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import type { IndustryGroup, PracticeGroup } from "@shared/schema";
import type { TeamMemberFormData } from "./contracts";

export function CapabilitiesTab({ form, language, practiceGroups, industryGroups }: {
  form: UseFormReturn<TeamMemberFormData>;
  language: string;
  practiceGroups: PracticeGroup[];
  industryGroups: IndustryGroup[];
}) {
  return (
                    <TabsContent value="practices" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">
                                {language === "es" ? "Áreas de práctica e industrias" : "Practice Areas & Industries"}
                              </CardTitle>
                              <CardDescription className="text-[#878A8E]">
                                {language === "es"
                                  ? "Un abogado puede pertenecer a varias áreas de práctica e industrias."
                                  : "A lawyer can belong to multiple practice areas and industries."}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                          <FormField
                            control={form.control}
                            name="practiceGroupIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-[#878A8E]" />
                                  {language === "es" ? "Áreas de práctica" : "Practice Areas"}
                                </FormLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto border border-[#D9D8D7] p-4">
                                  {practiceGroups.length === 0 && (
                                    <p className="text-sm text-[#878A8E] col-span-2">
                                      {language === "es" ? "Cargando…" : "Loading…"}
                                    </p>
                                  )}
                                  {practiceGroups.map((pg) => {
                                    const label = language === "es" ? pg.nameEs : pg.name;
                                    const checked = field.value?.includes(pg.id) ?? false;
                                    return (
                                      <label key={pg.id} className="flex items-center gap-2 text-sm text-[#1D1D1B] cursor-pointer">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(c) => {
                                            const current = field.value || [];
                                            field.onChange(
                                              c ? [...current, pg.id] : current.filter((id) => id !== pg.id)
                                            );
                                          }}
                                          data-testid={`checkbox-practice-${pg.slug}`}
                                        />
                                        {label}
                                      </label>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator className="bg-[#D9D8D7]" />

                          <FormField
                            control={form.control}
                            name="industryGroupIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-[#878A8E]" />
                                  {language === "es" ? "Industrias / sectores" : "Industries"}
                                </FormLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto border border-[#D9D8D7] p-4">
                                  {industryGroups.length === 0 && (
                                    <p className="text-sm text-[#878A8E] col-span-2">
                                      {language === "es" ? "Cargando…" : "Loading…"}
                                    </p>
                                  )}
                                  {industryGroups.map((ig) => {
                                    const label = language === "es" ? ig.nameEs : ig.name;
                                    const checked = field.value?.includes(ig.id) ?? false;
                                    return (
                                      <label key={ig.id} className="flex items-center gap-2 text-sm text-[#1D1D1B] cursor-pointer">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(c) => {
                                            const current = field.value || [];
                                            field.onChange(
                                              c ? [...current, ig.id] : current.filter((id) => id !== ig.id)
                                            );
                                          }}
                                          data-testid={`checkbox-industry-${ig.slug}`}
                                        />
                                        {label}
                                      </label>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
  );
}
