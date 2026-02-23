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
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('AWS_REGION');
        this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME')!;

        if (!accessKeyId || !secretAccessKey || !region || !this.bucketName) {
            this.logger.error('AWS S3 configurations are missing in .env');
        } else {
            this.logger.log(`S3 Config Loaded: Region=${region}, Bucket=${this.bucketName}, KeyID=${accessKeyId.substring(0, 8)}...`);
        }

        this.s3Client = new S3Client({
            region: region!,
            credentials: {
                accessKeyId: accessKeyId!,
                secretAccessKey: secretAccessKey!,
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

            const region = this.configService.get<string>('AWS_REGION');
            return `https://${this.bucketName}.s3.${region}.amazonaws.com/uploads/${filename}`;
        } catch (error) {
            this.logger.error(`Error uploading file to S3: ${error.message}`);
            console.error('Full S3 Error:', error);
            throw error;
        }
    }

    async deleteFile(url: string): Promise<void> {
        if (!url.includes(this.bucketName)) return;

        try {
            const key = url.split('.com/')[1];
            this.logger.log(`Deleting file from S3. Bucket: ${this.bucketName}, Key: ${key}`);
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }),
            );
            this.logger.log(`Successfully deleted file from S3: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting file from S3: ${error.message}`);
        }
    }
}
