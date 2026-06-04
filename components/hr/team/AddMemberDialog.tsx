"use client";

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user.store";

interface AddMemberDialogProps {
  projectId: string;
  onAdd: (profileId: string, role: "MEMBER" | "MANAGER") => void;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMemberDialog({
  projectId,
  onAdd,
  disabled,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddMemberDialogProps) {
  const { users, fetchUsers } = useUserStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-1.5" />
        Add Member
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a user to this project team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="member" className="h-9">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "MEMBER" | "MANAGER")
              }
            >
              <SelectTrigger id="role" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
