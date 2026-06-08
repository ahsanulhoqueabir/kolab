import { create } from "zustand";
import { api_client } from "@/lib/api/api-client";

// ─── Types ───────────────────────────────────────────────────────────────

export interface QueuedFile {
  /** Client-side temp id */
  id: string;
  /** Original file name */
  name: string;
  /** The raw File object — used for direct upload to signed URL */
  file: File;
  /** File size in bytes */
  size: number;
}

/** Shape returned by POST /api/r2/signed-upload-urls */
interface SignedUploadUrlResult {
  key: string;
  signedUrl: string;
  publicUrl: string;
}

interface UploadState {
  /** Files queued for upload */
  queuedFiles: QueuedFile[];
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Upload progress (0–100) across all files */
  uploadProgress: number;
}

interface UploadActions {
  /**
   * Add File objects to the queue.
   */
  queueFiles: (files: FileList | File[]) => Promise<void>;
  /**
   * Remove a queued file by id.
   */
  removeFile: (id: string) => void;
  /**
   * Clear all queued files.
   */
  clearFiles: () => void;
  /**
   * Upload all queued files directly to Cloudflare R2 via signed URLs.
   *
   * Flow:
   *  1. Call POST /api/r2/signed-upload-urls with file metadata
   *  2. Upload each file directly to its signed URL (client-side PUT)
   *  3. Return the public URLs array
   *
   * @param folder Optional sub-folder in the R2 bucket
   * @returns Array of public URLs of uploaded files
   */
  uploadAndGetUrls: (folder?: string) => Promise<string[]>;
}

type UploadStore = UploadState & UploadActions;

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Derive MIME type from file name */
function getContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    txt: "text/plain",
    json: "application/json",
    zip: "application/zip",
  };
  return map[ext || ""] || "application/octet-stream";
}

// ─── Store ───────────────────────────────────────────────────────────────

export const useUploadStore = create<UploadStore>((set, get) => ({
  queuedFiles: [],
  isUploading: false,
  uploadProgress: 0,

  queueFiles: async (files) => {
    const fileArray = files instanceof FileList ? Array.from(files) : files;

    const converted: QueuedFile[] = fileArray.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      file: f,
      size: f.size,
    }));

    set((s) => ({ queuedFiles: [...s.queuedFiles, ...converted] }));
  },

  removeFile: (id) => {
    set((s) => ({
      queuedFiles: s.queuedFiles.filter((qf) => qf.id !== id),
    }));
  },

  clearFiles: () => {
    set({ queuedFiles: [], isUploading: false, uploadProgress: 0 });
  },

  uploadAndGetUrls: async (folder = "") => {
    const { queuedFiles } = get();
    if (queuedFiles.length === 0) return [];

    set({ isUploading: true, uploadProgress: 0 });

    try {
      // ── Step 1: Get signed upload URLs from server ────────────────
      const payload = queuedFiles.map((qf) => ({
        fileName: qf.name,
        contentType: getContentType(qf.name),
      }));

      const { data: signedResults } = await api_client.post<{
        data: SignedUploadUrlResult[];
      }>("/r2/signed-upload-urls", {
        files: payload,
        folder,
      });

      const urls = signedResults.data;
      const total = urls.length;

      // ── Step 2: Upload each file directly to its signed URL ────────
      const publicUrls: string[] = [];

      for (let i = 0; i < total; i++) {
        const item = urls[i];
        const qf = queuedFiles[i];

        await fetch(item.signedUrl, {
          method: "PUT",
          body: qf.file,
          headers: { "Content-Type": getContentType(qf.name) },
        });

        publicUrls.push(item.publicUrl);

        // Update progress
        set({ uploadProgress: Math.round(((i + 1) / total) * 100) });
      }

      // ── Step 3: Clear queue & return ──────────────────────────────
      set({ queuedFiles: [], isUploading: false, uploadProgress: 100 });

      return publicUrls;
    } catch {
      set({ isUploading: false });
      throw new Error("File upload failed");
    }
  },
}));
