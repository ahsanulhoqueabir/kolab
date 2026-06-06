export interface UploadFileParams {
  file: File | Buffer;
  fileName: string;
  folder?: string;
  contentType?: string;
}

export interface UploadFileResult {
  success: boolean;
  url: string;
  key: string;
  fileName: string;
  size: number;
}

export interface DeleteFileParams {
  key: string;
}

export interface DeleteFileResult {
  success: boolean;
  key: string;
}

export interface GetFileUrlParams {
  key: string;
  expiresIn?: number; // in seconds, for signed URLs
}

export interface ListFilesParams {
  prefix?: string;
  maxKeys?: number;
}

export interface FileObject {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}

export interface ListFilesResult {
  files: FileObject[];
  hasMore: boolean;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}
