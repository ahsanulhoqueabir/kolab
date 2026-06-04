/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Shield, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/ui/button";

interface RoleListCardProps {
  role: {
    id: string | number;
    name: string;
    permission?: any[] | null;
    page?: any[] | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

// In case Card / CardContent are not present, we can just use styled divs
export function RoleListCard({ role, onEdit, onDelete }: RoleListCardProps) {
  const permissionCount = role.permission?.length || 0;
  const pageCount = role.page?.length || 0;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-lg">{role.name}</span>
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

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Badge variant="secondary">{permissionCount} Permissions</Badge>
        <Badge variant="outline">{pageCount} Pages</Badge>
      </div>
    </div>
  );
}
