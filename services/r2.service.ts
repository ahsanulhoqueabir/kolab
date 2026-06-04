import { r2 } from "@/config/env.config";
import {
  CopyObjectPair,
  CopyResult,
  DeleteResult,
  ExistsResult,
  R2Body,
  SignedUrlParams,
  SignedUrlResult,
  UploadObjectParams,
  UploadResult,
} from "@/types/business/r2.types";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type DeleteObjectsCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class R2Service {
  private static readonly endpoint = `https://${r2.id}.r2.cloudflarestorage.com`;
  private static readonly publicBaseUrl = r2.publicUrl;
  private static client: S3Client | null = null;

  private static getClient() {
    if (this.client) {
      return this.client;
    }

    if (!r2.id || !r2.key || !r2.secret || !r2.bucket) {
      throw new Error("R2 configuration is missing in environment variables");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: r2.key,
        secretAccessKey: r2.secret,
      },
    });

    return this.client;
  }

  private static sanitizePathPart(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/[^a-z0-9.-/]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  private static sanitizeTitle(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[_/]+/g, "-")
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static normalizeBody(body: R2Body) {
    if (body instanceof ArrayBuffer) {
      return new Uint8Array(body);
    }

    return body;
  }

  static createObjectKey(fileName: string, folder = "uploads", ext?: string) {
    const cleanName = this.sanitizeTitle(fileName);
    const cleanFolder = this.sanitizePathPart(folder) || "uploads";
    const stamp = Date.now();
    const extension = ext ? `.${ext.replace(/^\./, "")}` : "";

    return `${cleanFolder}/${stamp}-${cleanName}${extension}`;
  }

  static getPublicUrl(key: string) {
    const base = this.publicBaseUrl;
    if (!base) {
      return undefined;
    }

    return `${base.replace(/\/$/, "")}/${key}`;
  }

  static async uploadObject(params: UploadObjectParams): Promise<UploadResult> {
    try {
      const client = this.getClient();
      const key = this.createObjectKey(
        params.fileName,
        params.folder,
        params.type,
      );

      const command = new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: this.normalizeBody(params.body),
        ContentType: params.contentType || "application/octet-stream",
        CacheControl: params.cacheControl,
        Metadata: params.metadata,
      });

      const response = await client.send(command);

      return {
        success: true,
        key,
        etag: response.ETag,
        publicUrl: this.getPublicUrl(key),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      };
    }
  }

  static async generateSignedUploadUrl(
    fileName: string,
    options?: {
      folder?: string;
      contentType?: string;
      expiresIn?: number;
      cacheControl?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<SignedUrlResult> {
    try {
      const client = this.getClient();
      const key = this.createObjectKey(fileName, options?.folder);
      const expiresIn = options?.expiresIn ?? 300;

      const command = new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        ContentType: options?.contentType || "application/octet-stream",
        CacheControl: options?.cacheControl,
        Metadata: options?.metadata,
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      return {
        success: true,
        key,
        url,
        expiresIn,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate signed upload URL",
      };
    }
  }

  static async generateSignedUrl({
    key,
    expiresIn = 18000, // 5 hours
    type = "view",
    fileName,
  }: SignedUrlParams): Promise<SignedUrlResult> {
    try {
      const client = this.getClient();
      let contentType: string | undefined;

      try {
        const head = await client.send(
          new HeadObjectCommand({
            Bucket: r2.bucket,
            Key: key,
          }),
        );

        contentType = head.ContentType;
      } catch {
        // Skip content type when metadata fetch fails.
      }

      const resolvedFileName = fileName || key.split("/").pop() || "download";

      const command = new GetObjectCommand({
        Bucket: r2.bucket,
        Key: key,

        ...(type === "download" && {
          ResponseContentDisposition: `attachment; filename="${resolvedFileName}"`,
        }),

        ...(type === "view" && {
          ResponseContentDisposition: `inline`,
        }),
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      return {
        success: true,
        key,
        url,
        expiresIn,
        type,
        contentType,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate signed URL",
      };
    }
  }

  static async deleteObject(key: string): Promise<DeleteResult> {
    try {
      const client = this.getClient();
      await client.send(
        new DeleteObjectCommand({
          Bucket: r2.bucket,
          Key: key,
        }),
      );

      return {
        success: true,
        deletedKeys: [key],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      };
    }
  }

  static async deleteMultipleObjects(keys: string[]): Promise<DeleteResult> {
    try {
      if (!keys.length) {
        return { success: true, deletedKeys: [] };
      }

      const client = this.getClient();

      const uniqueKeys = [...new Set(keys)];
      const chunkSize = 1000;

      const allDeleted: string[] = [];
      const allFailed: string[] = [];

      for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
        const chunk = uniqueKeys.slice(i, i + chunkSize);

        const payload: DeleteObjectsCommandInput = {
          Bucket: r2.bucket,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
          },
        };

        const response = await client.send(new DeleteObjectsCommand(payload));

        const deleted = (response.Deleted ?? [])
          .map((i) => i.Key)
          .filter((key): key is string => !!key);

        const failed = (response.Errors ?? [])
          .map((i) => i.Key)
          .filter((key): key is string => !!key);

        allDeleted.push(...deleted);
        allFailed.push(...failed);
      }

      return {
        success: allFailed.length === 0,
        deletedKeys: allDeleted,
        failedKeys: allFailed,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete files",
      };
    }
  }

  static async copyMultipleObjects(
    pairs: CopyObjectPair[],
  ): Promise<CopyResult> {
    try {
      if (!pairs.length) {
        return { success: true, copiedKeys: [] };
      }

      const client = this.getClient();
      const copiedKeys: string[] = [];
      const failedPairs: CopyObjectPair[] = [];

      for (const pair of pairs) {
        try {
          await client.send(
            new CopyObjectCommand({
              Bucket: r2.bucket,
              Key: pair.dest,
              CopySource: encodeURI(`${r2.bucket}/${pair.src}`),
            }),
          );

          copiedKeys.push(pair.dest);
        } catch {
          failedPairs.push(pair);
        }
      }

      return {
        success: failedPairs.length === 0,
        copiedKeys,
        failedPairs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to copy files",
      };
    }
  }

  static async objectExists(key: string): Promise<ExistsResult> {
    try {
      const client = this.getClient();
      const response = await client.send(
        new HeadObjectCommand({
          Bucket: r2.bucket,
          Key: key,
        }),
      );

      return {
        success: true,
        exists: true,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch file metadata";

      if (message.includes("NotFound") || message.includes("404")) {
        return {
          success: true,
          exists: false,
        };
      }

      return {
        success: false,
        exists: false,
        error: message,
      };
    }
  }
}
