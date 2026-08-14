import type { UseFormReturn } from "react-hook-form";
import { Image, Linkedin, Mail, Phone } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import type { TeamFormCopy, TeamMemberFormData } from "./contracts";

export function ContactTab({ form, t }: {
  form: UseFormReturn<TeamMemberFormData>;
  t: TeamFormCopy;
}) {
  return (
                    <TabsContent value="contact" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <Mail className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.contactInfo}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.contactInfoDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#878A8E]" />
                                    {t.email}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="mgarcia@vfrlaw.com"
                                      data-testid="input-email"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#878A8E]" />
                                    {t.phone}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="+52 55 1234 5678"
                                      data-testid="input-phone"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.phoneHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator className="bg-[#D9D8D7]" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="linkedinUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Linkedin className="w-4 h-4 text-[#878A8E]" />
                                    {t.linkedinUrl}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="https://linkedin.com/in/..."
                                      data-testid="input-linkedin"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.linkedinHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Image className="w-4 h-4 text-[#878A8E]" />
                                    {t.imageUrl}
                                  </FormLabel>
                                  <FormControl>
                                    <ImageUpload value={field.value || ""} onChange={field.onChange} placeholder="https://… o pega una ruta" />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.imageHint}
                                  </FormDescription>
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
