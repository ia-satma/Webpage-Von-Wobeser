import { motion } from "framer-motion";
import { Award, CheckCircle2, Linkedin, Mail, Phone, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamFormCopy, TeamMemberFormData } from "./contracts";
import { calculateProfileProgress, getTeamMemberInitials } from "./helpers";

interface TeamMemberPreviewProps {
  values: TeamMemberFormData;
  language: string;
  t: TeamFormCopy;
}

export function TeamMemberPreview({ values, language, t }: TeamMemberPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="sticky top-24"
    >
      <Card className="rounded-none border-[#D9D8D7] overflow-hidden">
        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA] py-4">
          <CardTitle className="text-sm font-medium text-[#878A8E] uppercase tracking-wide">
            {t.preview}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 text-center border-b border-[#D9D8D7]">
            <Avatar className="w-28 h-28 mx-auto mb-4 rounded-none">
              <AvatarImage src={values.imageUrl || undefined} alt={values.name} className="object-cover" />
              <AvatarFallback className="rounded-none bg-[#AA1A2E] text-white text-2xl font-bold">
                {values.name ? getTeamMemberInitials(values.name) : <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-[#1D1D1B] mb-1">
              {values.name || (language === "es" ? "Nombre del Abogado" : "Lawyer Name")}
            </h3>
            <p className="text-[#AA1A2E] font-medium mb-1">
              {language === "es" ? values.titleEs : values.title}
            </p>
            <p className="text-[#878A8E] text-sm">
              {language === "es" ? values.roleEs : values.role}
            </p>
            {values.isPartner && (
              <Badge className="mt-3 rounded-none bg-[#AA1A2E] text-white">
                <Award className="w-3 h-3 mr-1" />
                {language === "es" ? "Socio" : "Partner"}
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-3">
            {values.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#878A8E]" />
                <span className="text-[#54565B] truncate">{values.email}</span>
              </div>
            )}
            {values.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#878A8E]" />
                <span className="text-[#54565B]">{values.phone}</span>
              </div>
            )}
            {values.linkedinUrl && (
              <div className="flex items-center gap-3 text-sm">
                <Linkedin className="w-4 h-4 text-[#878A8E]" />
                <span className="text-[#54565B] truncate">LinkedIn Profile</span>
              </div>
            )}
          </div>
          <div className="p-4 bg-[#FAFAFA] border-t border-[#D9D8D7]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-[#54565B]">
                {language === "es" ? "Progreso del perfil" : "Profile Progress"}
              </span>
            </div>
            <div className="w-full bg-[#D9D8D7] h-2">
              <div
                className="bg-[#AA1A2E] h-2 transition-all duration-300"
                style={{ width: `${calculateProfileProgress(values)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
