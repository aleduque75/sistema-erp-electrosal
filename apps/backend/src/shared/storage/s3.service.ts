import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client | null = null;
    private readonly bucketName: string;
    private readonly hasCredentials: boolean = false;
    private readonly logger = new Logger(S3Service.name);

    constructor(private configService: ConfigService) {
        const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('R2_REGION') || this.configService.get<string>('AWS_REGION') || 'auto';
        const endpoint = this.configService.get<string>('R2_ENDPOINT') || this.configService.get<string>('AWS_ENDPOINT');
        this.bucketName = (this.configService.get<string>('R2_BUCKET_NAME') || this.configService.get<string>('AWS_BUCKET_NAME') || 'erp-electrosal-uploads')!;

        if (accessKeyId && secretAccessKey) {
            this.hasCredentials = true;
            this.s3Client = new S3Client({
                region: region,
                endpoint: endpoint || undefined,
                credentials: {
                    accessKeyId: accessKeyId,
                    secretAccessKey: secretAccessKey,
                },
            });
            this.logger.log(`S3/R2 Storage Configured: Endpoint=${endpoint || 'AWS S3'}, Bucket=${this.bucketName}`);
        } else {
            this.logger.warn('S3/Cloudflare R2 credentials missing. Media uploads will fall back to local disk storage.');
        }
    }

    async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

        if (this.hasCredentials && this.s3Client) {
            try {
                const upload = new Upload({
                    client: this.s3Client,
                    params: {
                        Bucket: this.bucketName,
                        Key: `uploads/${filename}`,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    },
                });

                await upload.done();

                const publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || this.configService.get<string>('AWS_PUBLIC_URL');
                if (publicUrl) {
                    const cleanPublicUrl = publicUrl.replace(/\/$/, '');
                    return `${cleanPublicUrl}/uploads/${filename}`;
                }

                const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
                return `https://${this.bucketName}.s3.${region}.amazonaws.com/uploads/${filename}`;
            } catch (error: any) {
                this.logger.error(`Failed to upload to S3/Cloudflare R2 (${error.message}). Falling back to local disk storage.`);
            }
        }

        // Fallback: Save file on local disk
        return this.saveFileLocally(file.buffer, filename);
    }

    private saveFileLocally(buffer: Buffer, filename: string): string {
        const uploadsDir = join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);

        const baseUrl = (this.configService.get<string>('API_URL') || 'https://erp.electrosal.com.br').replace(/\/$/, '');
        return `${baseUrl}/api/media/file/${filename}`;
    }

    async deleteFile(url: string): Promise<void> {
        if (!url) return;

        if (this.hasCredentials && this.s3Client && (url.includes('r2.dev') || url.includes('cloudflarestorage.com') || url.includes('amazonaws.com') || url.includes(this.bucketName))) {
            try {
                const key = url.includes('/uploads/')
                    ? `uploads/${url.split('/uploads/')[1]}`
                    : url.split('/').slice(3).join('/');

                this.logger.log(`Deleting file from S3/R2: ${key}`);
                await this.s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: key,
                    }),
                );
            } catch (error: any) {
                this.logger.error(`Error deleting file from S3/R2: ${error.message}`);
            }
        } else {
            // Delete local file if present
            const filename = url.split('/').pop();
            if (filename) {
                const filePath = join(process.cwd(), 'uploads', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
    }
}
