import type { UseFormReturn } from "react-hook-form";
import { Award, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import type { TeamFormCopy, TeamMemberFormData } from "./contracts";

export function SettingsTab({ form, t }: {
  form: UseFormReturn<TeamMemberFormData>;
  t: TeamFormCopy;
}) {
  return (
                    <TabsContent value="settings" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <Settings className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.settings}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.settingsDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="isPartner"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 border border-[#D9D8D7] bg-card">
                                <div className="space-y-1">
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Award className="w-4 h-4 text-[#AA1A2E]" />
                                    {t.isPartner}
                                  </FormLabel>
                                  <FormDescription className="text-[#878A8E] text-sm">
                                    {t.isPartnerDesc}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-[#AA1A2E]"
                                    data-testid="switch-partner"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="published"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 border border-[#D9D8D7] bg-card">
                                <div className="space-y-1">
                                  <FormLabel className="text-[#1D1D1B] font-medium">
                                    Visible en el sitio
                                  </FormLabel>
                                  <FormDescription className="text-[#878A8E] text-sm">
                                    Si lo apagas, este abogado se oculta del sitio público (sin eliminarlo).
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-[#AA1A2E]"
                                    data-testid="switch-published"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="border-l-2 border-[#AA1A2E] bg-[#FAFAFA] px-4 py-3 text-sm text-[#5E5E5E]">
                            <p className="font-medium text-[#1D1D1B]">{t.order}</p>
                            <p className="mt-1">{t.orderManaged}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
  );
}
