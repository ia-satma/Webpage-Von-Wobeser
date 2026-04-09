import { Link } from "wouter";
import { Download, Briefcase, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { isNativeLanguage } from "@/lib/translationUtils";
import type { TeamMember } from "@shared/schema";

interface TeamMemberCardProps {
  member: TeamMember;
  viewProfileLabel: string;
  positions: {
    foundingPartner: string;
    partner: string;
    ofCounsel: string;
    seniorAssociate: string;
    associate: string;
  };
}

export default function TeamMemberCard({ member, viewProfileLabel, positions }: TeamMemberCardProps) {
  const { language } = useLanguage();
  
  const { translatedFields, isLoading, isTranslating } = useTranslatedContent({
    contentType: 'team_member',
    entityId: member.id.toString(),
    fields: {
      title: member.title,
      titleEs: member.titleEs,
      role: member.role,
      roleEs: member.roleEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getSeniorityLabel = () => {
    if (member.isPartner) return positions.partner;
    if (member.title === "Of Counsel") return positions.ofCounsel;
    return positions.associate;
  };

  const getSeniorityColor = () => {
    if (member.isPartner) return "bg-primary text-white";
    if (member.title === "Of Counsel") return "bg-amber-600 text-white";
    return "bg-gray-600 text-white";
  };

  const handleDownloadVCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
  };

  const displayRole = translatedFields.role || member.role;
  const showTranslationIndicator = isLoading || isTranslating;

  return (
    <Card
      className="group h-full rounded-md border border-border shadow-sm hover:shadow-lg transition-all duration-300 bg-card"
      data-testid={`card-team-member-${member.slug}`}
    >
      <CardContent className="p-6 text-center">
        <Link href={`/team/${member.slug}`}>
          <div className="cursor-pointer">
            <div className="relative mb-4 mx-auto w-fit">
              <Avatar className="w-24 h-24 mx-auto border-2 border-border">
                <AvatarImage 
                  src={member.imageUrl || undefined} 
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 
              className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors"
              data-testid={`text-team-member-name-${member.slug}`}
            >
              {member.name}
            </h3>
            <Badge 
              className={`mb-2 rounded-md text-xs ${getSeniorityColor()}`}
              data-testid={`badge-seniority-${member.slug}`}
            >
              {getSeniorityLabel()}
            </Badge>
            <div className="relative min-h-[1.25rem]">
              {showTranslationIndicator ? (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
              ) : (
                <p 
                  className="text-sm text-muted-foreground"
                  data-testid={`text-team-member-role-${member.slug}`}
                >
                  {displayRole}
                </p>
              )}
            </div>
          </div>
        </Link>
        <div className="mt-4 pt-4 border-t border-border flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-md text-xs"
            onClick={handleDownloadVCard}
            data-testid={`button-download-vcard-${member.slug}`}
          >
            <Download className="w-3 h-3" />
            vCard
          </Button>
          <Link href={`/team/${member.slug}`}>
            <Button
              variant="default"
              size="sm"
              className="gap-1 rounded-md text-xs"
              data-testid={`button-view-profile-${member.slug}`}
            >
              <Briefcase className="w-3 h-3" />
              {viewProfileLabel}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
