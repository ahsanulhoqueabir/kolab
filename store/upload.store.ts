import { create } from "zustand";

// ─── Types ───────────────────────────────────────────────────────────────

export interface QueuedFile {
  /** Client-side temp id */
  id: string;
  /** Original file name */
  name: string;
  /** Base64-encoded file content (data URI like "data:image/png;base64,...") */
  base64: string;
  /** File size in bytes */
  size: number;
}

interface UploadState {
  /** Files queued as base64 strings, ready to be sent with the form */
  queuedFiles: QueuedFile[];
}

interface UploadActions {
  /**
   * Read File objects, convert to base64, and add to the queue.
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
}

type UploadStore = UploadState & UploadActions;

// ─── Helpers ─────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Store ───────────────────────────────────────────────────────────────

export const useUploadStore = create<UploadStore>((set) => ({
  queuedFiles: [],

  queueFiles: async (files) => {
    const fileArray = files instanceof FileList ? Array.from(files) : files;

    const converted: QueuedFile[] = await Promise.all(
      fileArray.map(async (f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        base64: await fileToBase64(f),
        size: f.size,
      })),
    );

    set((s) => ({ queuedFiles: [...s.queuedFiles, ...converted] }));
  },

  removeFile: (id) => {
    set((s) => ({
      queuedFiles: s.queuedFiles.filter((qf) => qf.id !== id),
    }));
  },

  clearFiles: () => {
    set({ queuedFiles: [] });
  },
}));
