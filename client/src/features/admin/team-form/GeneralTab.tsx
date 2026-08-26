import type { UseFormReturn } from "react-hook-form";
import { Briefcase, Globe, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { getAttorneyFullName } from "@shared/attorneyName";
import type { TeamFormCopy, TeamMemberFormData } from "./contracts";

export function GeneralTab({ form, t, language, generateSlug }: {
  form: UseFormReturn<TeamMemberFormData>;
  t: TeamFormCopy;
  language: string;
  generateSlug: () => void;
}) {
  const updateStructuredName = (field: "givenNames" | "firstSurname" | "secondSurname", value: string) => {
    const next = {
      givenNames: form.getValues("givenNames"),
      firstSurname: form.getValues("firstSurname"),
      secondSurname: form.getValues("secondSurname"),
      [field]: value,
    };
    form.setValue("name", getAttorneyFullName(next), { shouldDirty: true, shouldValidate: false });
  };
  const fullLegalName = getAttorneyFullName({
    givenNames: form.watch("givenNames"),
    firstSurname: form.watch("firstSurname"),
    secondSurname: form.watch("secondSurname"),
  });

  return (
                    <TabsContent value="general" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.basicInfo}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.basicInfoDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name="givenNames"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    {t.givenNames}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="María Elisa"
                                      onChange={(event) => {
                                        field.onChange(event);
                                        updateStructuredName("givenNames", event.target.value);
                                      }}
                                      onBlur={() => {
                                        field.onBlur();
                                        if (!form.getValues("slug")) {
                                          generateSlug();
                                        }
                                      }}
                                      data-testid="input-given-names"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.givenNamesHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="firstSurname"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    {t.firstSurname}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="García"
                                      onChange={(event) => {
                                        field.onChange(event);
                                        updateStructuredName("firstSurname", event.target.value);
                                      }}
                                      data-testid="input-first-surname"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.firstSurnameHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="secondSurname"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium">{t.secondSurname}</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="López"
                                      onChange={(event) => {
                                        field.onChange(event);
                                        updateStructuredName("secondSurname", event.target.value);
                                      }}
                                      data-testid="input-second-surname"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">{t.secondSurnameHint}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <FormField
                              control={form.control}
                              name="slug"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    {t.slug}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">{t.requiredField}</Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E] font-mono text-sm" data-testid="input-slug" />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">{t.slugHint}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="pb-1">
                              <p className="text-sm font-medium text-[#1D1D1B]">{t.name}</p>
                              <p className="mt-1 text-sm text-[#54565B]" data-testid="text-full-legal-name">{fullLegalName || "—"}</p>
                              <p className="mt-1 text-xs text-[#878A8E]">{t.nameHint}</p>
                            </div>
                          </div>

                          <Separator className="bg-[#D9D8D7]" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#878A8E]" />
                                    {t.title}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-none border-[#D9D8D7]" data-testid="input-title">
                                        <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-none">
                                      <SelectItem value="Partner">Partner</SelectItem>
                                      <SelectItem value="Of Counsel">Of Counsel</SelectItem>
                                      <SelectItem value="Counsel">Counsel</SelectItem>
                                      <SelectItem value="Associate">Associate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.titleHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="titleEs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#878A8E]" />
                                    {t.titleEs}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="Socio, Socia, Asociado, Asociada, Of Counsel, Counsel…"
                                      data-testid="input-title-es"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.titleEsHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#878A8E]" />
                                    {t.role}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-none border-[#D9D8D7]" data-testid="select-role">
                                        <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-none">
                                      <SelectItem value="Partner">{t.roles.partner}</SelectItem>
                                      <SelectItem value="Of Counsel">{t.roles.ofCounsel}</SelectItem>
                                      <SelectItem value="Counsel">{t.roles.counsel}</SelectItem>
                                      <SelectItem value="Senior Associate">{t.roles.seniorAssociate}</SelectItem>
                                      <SelectItem value="Associate">{t.roles.associate}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="roleEs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#878A8E]" />
                                    {t.roleEs}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-none border-[#D9D8D7]" data-testid="select-role-es">
                                        <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-none">
                                      <SelectItem value="Socio">{t.rolesEs.partner}</SelectItem>
                                      <SelectItem value="Socia">{t.rolesEs.partnerFemale}</SelectItem>
                                      <SelectItem value="Of Counsel">{t.rolesEs.ofCounsel}</SelectItem>
                                      <SelectItem value="Counsel">{t.rolesEs.counsel}</SelectItem>
                                      <SelectItem value="Asociado Senior">{t.rolesEs.seniorAssociate}</SelectItem>
                                      <SelectItem value="Asociada Senior">{t.rolesEs.seniorAssociateFemale}</SelectItem>
                                      <SelectItem value="Asociado">{t.rolesEs.associate}</SelectItem>
                                      <SelectItem value="Asociada">{t.rolesEs.associateFemale}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
  );
}
