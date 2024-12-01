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
    private bucketEndpoint = this.configService.get('S3_BUCKET_ENDPOINT');

    constructor(private readonly configService: ConfigService) {
        this.client = new S3Client({
            endpoint: this.configService.get('S3_ENDPOINT'),
            region: this.configService.get('S3_REGION'),
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
        key,
        obj,
        isPublic = true,
    }: {
        key?: string;
        obj: any;
        isPublic?: boolean;
    }) {
        try {
            let _key = key ?? `${uuidv4()}`;
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: _key,
                Body: JSON.stringify(obj),
                ContentType: 'application/json; charset=utf-8',
                ACL: isPublic ? 'public-read' : 'private',
            });

            await this.client.send(command);

            return {
                url: isPublic
                    ? (await this.getFileUrl(_key)).url
                    : (await this.getPresignedSignedUrl(_key)).url,
                key: _key,
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
        return { url: `${this.bucketEndpoint}/${key}` };
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
