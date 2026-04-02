import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

// ============================================
// AWS S3 Storage Service
// ============================================

export interface UploadOptions {
  folder: string;
  fileName: string;
  contentType: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export interface SignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get<string>('aws.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });

    this.bucket = this.configService.get<string>('aws.s3.bucket') || 'myhipa-media';
    this.cloudfrontUrl = this.configService.get<string>('aws.cloudfront.url') || '';
  }

  /**
   * Generate a pre-signed URL for direct upload
   */
  async generateUploadUrl(options: UploadOptions): Promise<SignedUrlResult> {
    const key = `${options.folder}/${Date.now()}-${options.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 3600, // 1 hour
    });

    const publicUrl = this.cloudfrontUrl 
      ? `https://${this.cloudfrontUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return {
      uploadUrl,
      key,
      publicUrl,
    };
  }

  /**
   * Generate a pre-signed URL for download
   */
  async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Delete an object from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Copy an object within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.client.send(command);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    return this.cloudfrontUrl
      ? `https://${this.cloudfrontUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  /**
   * Upload base64 image and return URL
   */
  async uploadBase64Image(
    base64Data: string,
    folder: string,
    fileName: string
  ): Promise<string> {
    // Extract content type from base64
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data');
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // 1 year cache
    });

    await this.client.send(command);

    return this.getPublicUrl(key);
  }

  /**
   * Process image - create variants (thumbnail, medium, large)
   * Note: In production, use AWS Lambda triggers for image processing
   */
  async createImageVariants(key: string): Promise<{
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    // This would typically trigger a Lambda function or use Sharp
    // For now, return the original as all variants
    const baseUrl = this.getPublicUrl(key);
    
    return {
      thumbnail: baseUrl,
      medium: baseUrl,
      large: baseUrl,
    };
  }
}

// ============================================
// File Type Validation
// ============================================

export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav'],
};

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 10 * 1024 * 1024, // 10MB
  audio: 10 * 1024 * 1024, // 10MB
};

export function validateFileType(contentType: string, category: keyof typeof ALLOWED_FILE_TYPES): boolean {
  return ALLOWED_FILE_TYPES[category]?.includes(contentType) || false;
}

export function validateFileSize(size: number, category: keyof typeof MAX_FILE_SIZES): boolean {
  return size <= MAX_FILE_SIZES[category];
}
