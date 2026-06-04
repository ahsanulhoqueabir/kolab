"use client";

import { useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/store/task.store";
import { toast } from "sonner";

interface CommentSectionProps {
  taskId: string;
  currentComment?: string | null;
  disabled?: boolean;
}

/**
 * Comment section for tasks.
 * Uses the existing task store's updateTask method to save comments
 * via the PATCH /api/tasks/[id] route (requires task:update permission).
 */
export function CommentSection({
  taskId,
  currentComment,
  disabled,
}: CommentSectionProps) {
  const [comment, setComment] = useState(currentComment || "");
  const [isSaving, setIsSaving] = useState(false);
  const { updateTask } = useTaskStore();

  const handleSave = async () => {
    if (comment === (currentComment || "")) return;

    setIsSaving(true);
    try {
      const result = await updateTask(taskId, { comment });
      if (result.success) {
        toast.success("Comment saved");
      } else {
        toast.error(result.message || "Failed to save comment");
      }
    } catch {
      toast.error("Failed to save comment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Comment</h3>
      </div>

      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || isSaving}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={
                disabled || isSaving || comment === (currentComment || "")
              }
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? "Saving..." : "Save Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
