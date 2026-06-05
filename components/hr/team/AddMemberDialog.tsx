"use client";

import { useState, useEffect, useMemo } from "react";
import { UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user.store";
import { SearchComboBox } from "@/components/core/shared/SearchComboBox";

interface AddMemberDialogProps {
  projectId: string;
  onAdd: (profileId: string, role: "MEMBER" | "MANAGER") => void;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMemberDialog({
  onAdd,
  disabled,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddMemberDialogProps) {
  const { items: users, fetchUsers } = useUserStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen;

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "MANAGER">(
    "MEMBER",
  );

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  const handleAdd = () => {
    if (!selectedUser) return;
    onAdd(selectedUser, selectedRole);
    setOpen(false);
    setSelectedUser("");
    setSelectedRole("MEMBER");
  };

  const memberOptions = useMemo(() => {
    return (users || []).map((u) => ({
      value: u.id,
      label: `${u.name} (${u.email})`,
    }));
  }, [users]);

  const roleOptions = [
    { value: "MEMBER", label: "Member" },
    { value: "MANAGER", label: "Manager" },
  ];

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
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
        onClick={() => setOpen(false)}
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
              Add a user to this project team to collaborate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="member" className="text-sm font-medium">
              Select Member
            </Label>
            <SearchComboBox
              options={memberOptions}
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="Choose a user"
              searchPlaceholder="Search users..."
              emptyMessage="No users found."
            />
          </div>

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
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd} disabled={!selectedUser}>
            Add to Team
          </Button>
        </div>
      </div>
    </>
  );
}
