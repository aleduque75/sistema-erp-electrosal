import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly logger = new Logger(S3Service.name);

    constructor(private configService: ConfigService) {
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || this.configService.get<string>('R2_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || this.configService.get<string>('R2_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('AWS_REGION') || 'auto';
        const endpoint = this.configService.get<string>('AWS_ENDPOINT') || this.configService.get<string>('R2_ENDPOINT');
        this.bucketName = (this.configService.get<string>('AWS_BUCKET_NAME') || this.configService.get<string>('R2_BUCKET_NAME') || 'erp-electrosal-uploads')!;

        if (!accessKeyId || !secretAccessKey) {
            this.logger.warn('AWS/Cloudflare R2 credentials missing in environment variables.');
        } else {
            this.logger.log(`S3/R2 Config Loaded: Region=${region}, Bucket=${this.bucketName}, KeyID=${accessKeyId.substring(0, 8)}..., Endpoint=${endpoint || 'AWS Default'}`);
        }

        this.s3Client = new S3Client({
            region: region,
            endpoint: endpoint || undefined,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
        });
    }

    async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

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

            const publicUrl = this.configService.get<string>('AWS_PUBLIC_URL') || this.configService.get<string>('R2_PUBLIC_URL');
            if (publicUrl) {
                const cleanPublicUrl = publicUrl.replace(/\/$/, '');
                return `${cleanPublicUrl}/uploads/${filename}`;
            }

            const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
            return `https://${this.bucketName}.s3.${region}.amazonaws.com/uploads/${filename}`;
        } catch (error) {
            this.logger.error(`Error uploading file to S3/R2: ${error.message}`);
            console.error('Full Storage Error:', error);
            throw error;
        }
    }

    async deleteFile(url: string): Promise<void> {
        if (!url || (!url.includes('http') && !url.includes(this.bucketName))) return;

        try {
            const key = url.includes('/uploads/')
                ? `uploads/${url.split('/uploads/')[1]}`
                : url.split('/').slice(3).join('/');

            this.logger.log(`Deleting file from S3/R2. Bucket: ${this.bucketName}, Key: ${key}`);
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }),
            );
            this.logger.log(`Successfully deleted file from S3/R2: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting file from S3/R2: ${error.message}`);
        }
    }
}
