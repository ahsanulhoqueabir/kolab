import * as React from "react";
import { File, ExternalLink, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileListProps {
  files: string[];
  onRemove?: (url: string) => void;
  disabled?: boolean;
}

/**
 * Display a list of attached file URLs.
 * Each file can be opened in a new tab or removed.
 */
export function FileList({ files, onRemove, disabled }: FileListProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        <span>
          {files.length} file{files.length !== 1 ? "s" : ""} attached
        </span>
      </div>
      <div className="space-y-1.5">
        {files.map((url, idx) => {
          const fileName = url.split("/").pop() || `File ${idx + 1}`;
          return (
            <div
              key={url}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{fileName}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemove(url)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
