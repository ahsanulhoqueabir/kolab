"use client";

import { useCallback, useRef } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/core/ui/button";
import { useUploadStore, type QueuedFile } from "@/store/upload.store";

// ─── Types ───────────────────────────────────────────────────────────────

interface FileUploadProps {
  /** Current list of already-uploaded attachment URLs */
  value?: string[];
  /** Called when the list changes (add / remove) */
  onChange?: (urls: string[]) => void;
  /** Accepted MIME types, e.g. "image/*,.pdf" */
  accept?: string;
  /** Max file size in bytes (default 10 MB) */
  maxFileSize?: number;
  /** Disabled state */
  disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function FileUpload({
  value = [],
  onChange,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip",
  maxFileSize = 10 * 1024 * 1024,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queuedFiles = useUploadStore((s) => s.queuedFiles);
  const queueFiles = useUploadStore((s) => s.queueFiles);
  const removeFile = useUploadStore((s) => s.removeFile);

  // ── Remove an already-uploaded URL ──────────────────────────────────
  const handleRemove = useCallback(
    (url: string) => {
      onChange?.(value.filter((u) => u !== url));
    },
    [value, onChange],
  );

  // ── Handle file selection — convert to base64 & queue ───────────────
  const handleFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !files.length) return;

      // Filter out oversized files
      const validFiles: File[] = [];
      for (const f of Array.from(files)) {
        if (f.size > maxFileSize) {
          toastFileTooBig(f.name, maxFileSize);
          continue;
        }
        validFiles.push(f);
      }

      if (validFiles.length > 0) {
        await queueFiles(validFiles);
      }

      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [maxFileSize, queueFiles],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone / trigger */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Click to select files</p>
        <p className="text-xs text-muted-foreground">
          {accept} (max {Math.round(maxFileSize / 1024 / 1024)} MB each)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={handleFilesSelected}
        />
      </div>

      {/* Queued files (base64, not yet uploaded) */}
      {queuedFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            New files to upload ({queuedFiles.length})
          </p>
          <ul className="space-y-1">
            {queuedFiles.map((qf) => (
              <QueuedFileRow
                key={qf.id}
                file={qf}
                onRemove={removeFile}
                disabled={disabled}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Already-uploaded attachments (existing URLs) */}
      {value.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Attachments ({value.length})
          </p>
          <ul className="space-y-1">
            {value.map((url, idx) => {
              const name = url.split("/").pop() || `file-${idx + 1}`;
              return (
                <li
                  key={url}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                >
                  <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-blue-600 underline-offset-2 hover:underline"
                  >
                    {name}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemove(url)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function toastFileTooBig(name: string, max: number) {
  const mb = Math.round(max / 1024 / 1024);
  console.warn(`"${name}" exceeds the ${mb} MB limit and was skipped.`);
}

// ─── QueuedFileRow ──────────────────────────────────────────────────────

function QueuedFileRow({
  file,
  onRemove,
  disabled,
}: {
  file: QueuedFile;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm">
      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatSize(file.size)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(file.id)}
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </Button>
    </li>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
