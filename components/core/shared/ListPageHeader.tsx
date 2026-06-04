"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

interface ListPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function ListPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: ListPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-5 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
          {Icon && <Icon className="h-6 w-6 text-primary shrink-0" />}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
