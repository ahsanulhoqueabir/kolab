/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/ui/dialog"
import { Button } from "@/components/ui/button"

interface EmployeeBlockedDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: string
  name: string
  meta: any
}

export function EmployeeBlockedDeleteDialog({
  open,
  onOpenChange,
  type,
  name,
  meta,
}: EmployeeBlockedDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cannot Delete {type === "role" ? "Role" : "Resource"}
          </DialogTitle>
          <DialogDescription>
            The {type} <strong>{name}</strong> cannot be deleted because it is currently in use.
          </DialogDescription>
        </DialogHeader>

        {meta && (
          <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive-foreground">
            <p className="font-medium text-destructive">Reason:</p>
            <p className="text-muted-foreground">
              {meta.message || "This role has profiles assigned to it and cannot be removed until those profiles are updated or deleted."}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
