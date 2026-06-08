import { User, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/core/ui/avatar";
import { Button } from "@/components/ui/button";
interface UserListCardProps {
  user: {
    id: string | number;
    name: string;
    email: string;
    image?: string | null;
    active?: boolean;
    role?: { id: string; name: string } | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function UserListCard({ user, onEdit, onDelete }: UserListCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {user.image ? (
              <AvatarImage src={user.image ?? ""} alt={user.name} />
            ) : (
              <AvatarFallback>
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <span className="font-semibold block">{user.name}</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        <Badge variant={user.active ? "default" : "secondary"}>
          {user.active ? "Active" : "Inactive"}
        </Badge>
        {user.role && <Badge variant="outline">{user.role.name}</Badge>}
      </div>
    </div>
  );
}
