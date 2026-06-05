import * as React from "react";
import { User, Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamRole } from "@/types/db/team.types";
import { formatDateInTimezone } from "@/lib/date.utils";

interface TeamMemberCardProps {
  member: {
    id: string;
    profile:
      | { id: string; name: string; email: string; image?: string | null }
      | string;
    role: TeamRole;
    created_at: string;
  };
  onRemove: (profileId: string) => void;
}

export function TeamMemberCard({ member, onRemove }: TeamMemberCardProps) {
  const profile =
    typeof member.profile === "object" && member.profile !== null
      ? member.profile
      : null;

  const profileId = profile?.id || (member.profile as string);
  const name = profile?.name || "Unknown";
  const email = profile?.email || "";

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="font-semibold block">{name}</span>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(profileId)}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t">
        <Badge variant={member.role === "MANAGER" ? "default" : "secondary"}>
          <Shield className="h-3 w-3 mr-1" />
          {member.role === "MANAGER" ? "Manager" : "Member"}
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          Joined {formatDateInTimezone(member.created_at)}
        </span>
      </div>
    </div>
  );
}
