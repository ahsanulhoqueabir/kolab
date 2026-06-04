"use client";

import * as React from "react";
import { Shield } from "lucide-react";
import { PERMISSION_MODULES } from "@/config/permission.config";
import {
  permissionToString,
  getPermissionToPagesRequirementMap,
} from "@/lib/business/permission";
import { cn } from "@/lib/utils";

interface PermissionTableProps {
  selectedPermissions: string[];
  selectedPages: string[];
  onPermissionsChange: (permissions: string[]) => void;
  onPermissionUnselectBlocked?: (
    blocked: { permission: string; requiredByPages: string[] }[],
  ) => void;
  disabled?: boolean;
}

export function PermissionTable({
  selectedPermissions,
  selectedPages,
  onPermissionsChange,
  onPermissionUnselectBlocked,
  disabled,
}: PermissionTableProps) {
  // Build the reverse map of required permissions to know if we can unselect
  const requirementMap = React.useMemo(() => {
    return getPermissionToPagesRequirementMap(selectedPages);
  }, [selectedPages]);

  const handleToggle = (permissionName: string, checked: boolean) => {
    if (disabled) return;

    if (checked) {
      // Adding permission
      if (!selectedPermissions.includes(permissionName)) {
        onPermissionsChange([...selectedPermissions, permissionName]);
      }
    } else {
      // Removing permission — check if it is required by any selected page
      const requiredBy = requirementMap[permissionName] || [];
      if (requiredBy.length > 0) {
        if (onPermissionUnselectBlocked) {
          onPermissionUnselectBlocked([
            { permission: permissionName, requiredByPages: requiredBy },
          ]);
        }
        return;
      }

      onPermissionsChange(
        selectedPermissions.filter((p) => p !== permissionName),
      );
    }
  };

  // Get the display string for a condition
  const getConditionLabel = (condition?: string) => {
    if (!condition) return "";
    switch (condition) {
      case "all":
        return "All";
      case "own":
        return "Own";
      case "assigned":
        return "Assigned";
      default:
        return condition.charAt(0).toUpperCase() + condition.slice(1);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Resource Permissions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure CRUD permissions for system resources. Permissions marked
          with labels represent conditional access.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-4 font-medium text-muted-foreground w-1/4">
                Module / Resource
              </th>
              <th className="p-4 font-medium text-muted-foreground text-center w-[18%]">
                Create
              </th>
              <th className="p-4 font-medium text-muted-foreground text-center w-[22%]">
                Read
              </th>
              <th className="p-4 font-medium text-muted-foreground text-center w-[22%]">
                Update
              </th>
              <th className="p-4 font-medium text-muted-foreground text-center w-[18%]">
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((module) => {
              // Group permissions by action (create, read, update, delete)
              const actionsMap: Record<string, typeof module.permissions> = {
                create: [],
                read: [],
                update: [],
                delete: [],
              };

              module.permissions.forEach((perm) => {
                if (actionsMap[perm.action]) {
                  actionsMap[perm.action].push(perm);
                }
              });

              return (
                <tr
                  key={module.label}
                  className="border-b hover:bg-muted/10 transition-colors"
                >
                  <td className="p-4 align-middle">
                    <span className="font-medium block">{module.label}</span>
                  </td>

                  {/* Render cells for each action */}
                  {["create", "read", "update", "delete"].map((action) => {
                    const actionPerms = actionsMap[action] || [];

                    if (actionPerms.length === 0) {
                      return (
                        <td
                          key={action}
                          className="p-4 text-center align-middle text-muted-foreground/30"
                        >
                          &mdash;
                        </td>
                      );
                    }

                    return (
                      <td key={action} className="p-4 align-middle">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {actionPerms.map((perm) => {
                            const name = permissionToString(perm);
                            const isChecked =
                              selectedPermissions.includes(name);
                            const isRequired = !!requirementMap[name];

                            return (
                              <label
                                key={name}
                                className={cn(
                                  "inline-flex items-center gap-1.5 cursor-pointer text-xs select-none",
                                  disabled && "cursor-not-allowed opacity-50",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={disabled}
                                  onChange={(e) =>
                                    handleToggle(name, e.target.checked)
                                  }
                                  className={cn(
                                    "rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary",
                                    isRequired && "border-primary/50",
                                  )}
                                />
                                {perm.condition && (
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[10px] font-medium border bg-muted/50",
                                      perm.condition === "assigned" &&
                                        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                                      perm.condition === "own" &&
                                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                                      perm.condition === "all" &&
                                        "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
                                    )}
                                  >
                                    {getConditionLabel(perm.condition)}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
