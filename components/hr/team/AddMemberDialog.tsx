"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";
import { useUserStore } from "@/store/user.store";
import { useProjectStore } from "@/store/project.store";

interface AddMemberDialogProps {
  onAdd: (
    projectId: string,
    profileId: string,
    role: "MEMBER" | "MANAGER",
  ) => void;
  /** If provided, auto-selects this project when the dialog opens */
  defaultProjectId?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMemberDialog({
  onAdd,
  disabled,
  defaultProjectId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddMemberDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen;

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "MANAGER">(
    "MEMBER",
  );

  // ── Use stores ──
  const {
    searchResults: userResults,
    isSearching: isUserSearching,
    searchUsers,
    clearSearch,
  } = useUserStore();

  const {
    searchResults: projectResults,
    isSearching: isProjectSearching,
    searchProjects,
  } = useProjectStore();

  // ── Auto-select default project when dialog opens ──
  // Use a ref to track the previous open state so we only reset on open
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current && defaultProjectId) {
      setSelectedProject(defaultProjectId);
    }
    prevOpenRef.current = open;
  }, [open, defaultProjectId]);

  // ── Dynamic search handlers ──
  const handleUserSearch = useCallback(
    async (query: string) => {
      await searchUsers(query);
      const results = useUserStore.getState().searchResults || [];
      return results.map((u) => ({
        value: u.id,
        label: `${u.name} (${u.email})`,
      }));
    },
    [searchUsers],
  );

  const handleProjectSearch = useCallback(
    async (query: string) => {
      await searchProjects(query);
      const results = useProjectStore.getState().searchResults || [];
      return results.map((p) => ({
        value: p.id,
        label: p.name,
      }));
    },
    [searchProjects],
  );

  const handleAdd = () => {
    if (!selectedProject || !selectedUser) return;
    onAdd(selectedProject, selectedUser, selectedRole);
    setOpen(false);
    setSelectedProject("");
    setSelectedUser("");
    setSelectedRole("MEMBER");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Clear search state on close
      clearSearch();
    }
  };

  const roleOptions = useMemo(
    () => [
      { value: "MEMBER" as const, label: "Member" },
      { value: "MANAGER" as const, label: "Manager" },
    ],
    [],
  );

  const canSubmit = selectedProject && selectedUser;

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={() => handleOpenChange(true)}
      >
        <UserPlus className="h-4 w-4 mr-1.5" />
        Add Member
      </Button>

      {/* Sliding Panel Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-none",
          open ? "opacity-100 pointer-events-auto" : "opacity-0",
        )}
        onClick={() => handleOpenChange(false)}
      />

      {/* Sliding Panel Sheet */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l shadow-2xl p-6 flex flex-col gap-6 transition-transform duration-300 ease-in-out transform pointer-events-auto",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Team Member
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select a project, user, and role to add a team member.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-5">
          {/* Project selector */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">
              Select Project
            </Label>
            <SearchComboBox
              options={[]}
              value={selectedProject}
              onValueChange={setSelectedProject}
              placeholder="Search for a project..."
              searchPlaceholder="Type to search projects..."
              emptyMessage="No projects found."
              onSearch={handleProjectSearch}
              isSearching={isProjectSearching}
            />
          </div>

          {/* Member selector */}
          <div className="space-y-2">
            <Label htmlFor="member" className="text-sm font-medium">
              Select Member
            </Label>
            <SearchComboBox
              options={[]}
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="Search for a user..."
              searchPlaceholder="Type to search users..."
              emptyMessage="No users found."
              onSearch={handleUserSearch}
              isSearching={isUserSearching}
            />
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              Role
            </Label>
            <SearchComboBox
              options={roleOptions}
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "MEMBER" | "MANAGER")
              }
              placeholder="Select role"
              searchPlaceholder="Search roles..."
              emptyMessage="No roles found."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex items-center gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd} disabled={!canSubmit}>
            {isUserSearching || isProjectSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Searching...
              </>
            ) : (
              "Add to Team"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
