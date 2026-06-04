"use client";

import * as React from "react";
import { Upload, X, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  onFileAttached: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * File upload component using R2 presigned URLs.
 * Shows upload progress and supports drag-and-drop.
 */
export function FileUpload({
  onUpload,
  onFileAttached,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv",
  maxSizeMB = 10,
  disabled,
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        onFileAttached(url);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none",
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-primary">Click to upload</span>{" "}
              or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">
              {accept.replace(/,/g, ", ")} (max {maxSizeMB}MB)
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
