export type R2Body = Buffer | Uint8Array | ArrayBuffer | Blob | string;

export interface UploadObjectParams {
  body: R2Body;
  fileName: string;
  folder?: string;
  contentType?: string;
  /** File extension without dot (e.g. "pdf", "docx", "png"). Appended to the object key. */
  type?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  etag?: string;
  publicUrl?: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  key?: string;
  url?: string;
  type?: "view" | "download" | string;
  expiresIn?: number;
  contentType?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  deletedKeys?: string[];
  failedKeys?: string[];
  error?: string;
}

export interface ExistsResult {
  success: boolean;
  exists: boolean;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  error?: string;
}

export interface SignedUrlParams {
  key: string;
  expiresIn?: number;
  type?: "view" | "download" | string;
  fileName?: string;
}

export interface CopyObjectPair {
  src: string;
  dest: string;
}

export interface CopyResult {
  success: boolean;
  copiedKeys?: string[];
  failedPairs?: CopyObjectPair[];
  error?: string;
}
