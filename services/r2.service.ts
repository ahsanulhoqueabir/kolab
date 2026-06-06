import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  UploadFileParams,
  UploadFileResult,
  DeleteFileParams,
  DeleteFileResult,
  GetFileUrlParams,
  ListFilesParams,
  ListFilesResult,
  FileObject,
} from "@/types/business/file.types";
import { r2 } from "@/config/env.config";

export class FileService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    // Validate required configuration
    if (!r2.id || !r2.key || !r2.secret || !r2.bucket) {
      throw new Error(
        "Missing required Cloudflare R2 configuration. Please check your environment variables: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME",
      );
    }

    this.bucketName = r2.bucket;
    this.publicUrl = r2.publicUrl!;

    // Initialize S3 client for Cloudflare R2
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2.id}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2.key,
        secretAccessKey: r2.secret,
      },
    });
  }

  /**
   * Upload a file to Cloudflare R2
   */
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    const { file, fileName, folder = "", contentType } = params;

    // Validate inputs
    if (!file || !fileName) {
      throw new Error("File and fileName are required");
    }

    // Generate unique file key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = folder
      ? `${folder.replace(/^\/|\/$/g, "")}/${timestamp}_${sanitizedFileName}`
      : `${timestamp}_${sanitizedFileName}`;

    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    let fileSize: number;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileSize = file.size;
    } else {
      fileBuffer = file;
      fileSize = file.length;
    }

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || this.getContentType(fileName),
    });

    await this.s3Client.send(command);

    // Generate public URL
    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url,
      key,
      fileName: sanitizedFileName,
      size: fileSize,
    };
  }

  /**
   * Delete a file from Cloudflare R2
   */
  async deleteFile(params: DeleteFileParams): Promise<DeleteFileResult> {
    const { key } = params;

    if (!key) {
      throw new Error("File key is required");
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);

    return {
      success: true,
      key,
    };
  }

  /**
   * Get file URL (public or signed)
   */
  async getFileUrl(params: GetFileUrlParams): Promise<string> {
    const { key, expiresIn } = params;

    if (!key) {
      throw new Error("File key is required");
    }

    // If public URL is configured and no expiry needed, return public URL
    if (this.publicUrl && !expiresIn) {
      return `${this.publicUrl}/${key}`;
    }

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || 3600, // Default 1 hour
    });

    return signedUrl;
  }

  /**
   * List files in R2 bucket
   */
  async listFiles(params: ListFilesParams = {}): Promise<ListFilesResult> {
    const { prefix = "", maxKeys = 1000 } = params;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);

    const files: FileObject[] = (response.Contents || [])
      .map((item) => {
        if (!item.Key) return null;

        return {
          key: item.Key,
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          url: this.publicUrl
            ? `${this.publicUrl}/${item.Key}`
            : `https://${this.bucketName}.r2.cloudflarestorage.com/${item.Key}`,
        };
      })
      .filter((item): item is FileObject => item !== null);

    return {
      files,
      hasMore: response.IsTruncated || false,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: UploadFileParams[],
  ): Promise<UploadFileResult[]> {
    if (!files || files.length === 0) {
      throw new Error("Files array cannot be empty");
    }

    const uploadPromises = files.map((fileParams) =>
      this.uploadFile(fileParams),
    );
    return await Promise.all(uploadPromises);
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(keys: string[]): Promise<DeleteFileResult[]> {
    if (!keys || keys.length === 0) {
      throw new Error("Keys array cannot be empty");
    }

    const deletePromises = keys.map((key) => this.deleteFile({ key }));
    return await Promise.all(deletePromises);
  }

  /**
   * Helper: Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      // Videos
      mp4: "video/mp4",
      webm: "video/webm",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",

      // Other
      txt: "text/plain",
      json: "application/json",
      zip: "application/zip",
    };

    return contentTypes[extension || ""] || "application/octet-stream";
  }
}

// Export singleton instance
export const fileService = new FileService();

// ─────────────────────────────────────────────────────────────
// R2Service — static facade used by route handlers & services
// ─────────────────────────────────────────────────────────────

interface UploadObjectParams {
  body: Buffer;
  fileName: string;
  folder?: string;
  contentType?: string;
}

interface UploadObjectResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Processes an array of base64 data-URI strings → uploads each to R2
 * → returns an array of public URLs.
 *
 * Each item in the input array can be:
 *  - A base64 data URI (starts with "data:") → uploaded to R2
 *  - An https URL → kept as-is
 *  - Empty/falsy → filtered out
 */
async function processAttachments(
  attachments: string[],
  folder: string,
): Promise<string[]> {
  if (!attachments || attachments.length === 0) return [];

  const results = await Promise.all(
    attachments.map(async (item) => {
      if (!item) return null;

      // Already a URL → keep as-is
      if (item.startsWith("http")) return item;

      // Base64 data URI → upload to R2
      const mimeMatch = item.match(/^data:(image\/(\w+));base64,/);
      if (!mimeMatch) return null;

      const ext = mimeMatch[2];
      const base64Data = item.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const result = await fileService.uploadFile({
        file: buffer,
        fileName: `${Date.now()}.${ext}`,
        folder,
        contentType: mimeMatch[1],
      });

      return result.success ? result.url : null;
    }),
  );

  return results.filter((url): url is string => url !== null);
}

export class R2Service {
  /**
   * Upload a single buffer/object to R2.
   */
  static async uploadObject(
    params: UploadObjectParams,
  ): Promise<UploadObjectResult> {
    try {
      const result = await fileService.uploadFile({
        file: params.body,
        fileName: params.fileName,
        folder: params.folder,
        contentType: params.contentType,
      });

      return {
        success: true,
        publicUrl: result.url,
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message || "R2 upload failed",
      };
    }
  }

  /**
   * Upload multiple base64 attachments to R2.
   * Returns array of public URLs (https URLs passed through).
   */
  static processAttachments(
    attachments: string[],
    folder: string,
  ): Promise<string[]> {
    return processAttachments(attachments, folder);
  }
}
