import { EvmService } from '@/blockchain/services';
import { TradeEntity, TokenEntity } from '@/database/entities';
import { TradeRepository, TokenRepository } from '@/database/repositories';
import { PumpAbi } from '@/shared/blockchain/abis';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { BigNumber, ethers } from 'ethers';
import { SocketService } from './socket.service';
import { Between, LessThan } from 'typeorm';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const PRECISION = BigNumber.from('1000000000000000000');

@Injectable()
export class S3Service {
    private client: S3Client;
    private bucketName = this.configService.get('S3_BUCKET_NAME');

    constructor(private readonly configService: ConfigService) {
        const s3_region = this.configService.get('S3_REGION');

        if (!s3_region) {
            throw new Error('S3_REGION not found in environment variables');
        }

        this.client = new S3Client({
            region: s3_region,
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY'),
                secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY'),
            },
            forcePathStyle: true,
        });
    }

    async uploadSingleFile({
        file,
        isPublic = true,
    }: {
        file: Express.Multer.File;
        isPublic: boolean;
    }) {
        try {
            const key = `${uuidv4()}`;
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: isPublic ? 'public-read' : 'private',

                Metadata: {
                    originalName: file.originalname,
                },
            });

            const uploadResult = await this.client.send(command);

            return {
                url: isPublic
                    ? (await this.getFileUrl(key)).url
                    : (await this.getPresignedSignedUrl(key)).url,
                key,
                isPublic,
            };
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async uploadSingleJSON({
        obj,
        isPublic = true,
    }: {
        obj: any;
        isPublic?: boolean;
    }) {
        try {
            const key = `${uuidv4()}`;
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: JSON.stringify(obj),
                ContentType: 'application/json; charset=utf-8',
                ACL: isPublic ? 'public-read' : 'private',
            });

            await this.client.send(command);

            return {
                url: isPublic
                    ? (await this.getFileUrl(key)).url
                    : (await this.getPresignedSignedUrl(key)).url,
                key,
                isPublic,
            };
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async deleteFile(key: string) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            return this.client.send(command);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async getFileUrl(key: string) {
        return { url: `https://${this.bucketName}.s3.amazonaws.com/${key}` };
    }

    async getPresignedSignedUrl(key: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const url = await getSignedUrl(this.client, command, {
                expiresIn: 60 * 60 * 24, // 24 hours
            });

            return { url };
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
