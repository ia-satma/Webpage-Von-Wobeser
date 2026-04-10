import { Link } from "wouter";
import { Download, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const getSeniorityLabel = () => {
    if (member.isPartner) return positions.partner;
    if (member.title === "Of Counsel") return positions.ofCounsel;
    if (member.title?.toLowerCase().includes("senior associate")) return positions.seniorAssociate;
    return positions.associate;
  };

  const getSeniorityBg = () => {
    if (member.isPartner) return "bg-primary";
    if (member.title === "Of Counsel") return "bg-[#5B5C5F]";
    return "bg-[#8B8D89]";
  };

  const handleDownloadVCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
  };

  const displayRole = translatedFields.role || member.role;
  const showTranslating = isLoading || isTranslating;

  return (
    <div
      className="group relative overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
      style={{ aspectRatio: "3/4" }}
      data-testid={`card-team-member-${member.slug}`}
    >
      {/* Photo layer */}
      {member.imageUrl ? (
        <img
          src={member.imageUrl}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#D5D2CD" }}
        >
          <span className="text-4xl font-heading font-bold text-primary select-none">
            {getInitials(member.name)}
          </span>
        </div>
      )}

      {/* Top-left position pill */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className={`${getSeniorityBg()} text-white text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-1 inline-block`}
          data-testid={`text-seniority-${member.slug}`}
        >
          {getSeniorityLabel()}
        </span>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Bottom name + role text */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10">
        <Link href={`/team/${member.slug}`}>
          <p
            className="text-white font-heading font-bold text-sm tracking-[0.12em] uppercase leading-tight mb-0.5"
            data-testid={`text-team-member-name-${member.slug}`}
          >
            {member.name}
          </p>
          <p
            className={`text-[10px] tracking-[0.08em] leading-snug transition-opacity duration-300 ${showTranslating ? "opacity-40 animate-pulse" : "text-white/70"}`}
            data-testid={`text-team-member-role-${member.slug}`}
          >
            {displayRole}
          </p>
        </Link>
      </div>

      {/* Hover overlay with action buttons */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-20">
        <button
          onClick={handleDownloadVCard}
          className="w-32 h-8 border border-white text-white text-[10px] font-bold tracking-[0.1em] uppercase bg-transparent hover:bg-white hover:text-black transition-colors duration-200"
          data-testid={`button-download-vcard-${member.slug}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Download className="w-3 h-3" />
            vCard
          </span>
        </button>
        <Link href={`/team/${member.slug}`}>
          <button
            className="w-32 h-8 bg-primary text-white text-[10px] font-bold tracking-[0.1em] uppercase border-0 hover:bg-primary/90 transition-colors duration-200"
            data-testid={`button-view-profile-${member.slug}`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Briefcase className="w-3 h-3" />
              {viewProfileLabel}
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}
