import { BullRootModuleOptions } from '@nestjs/bull';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceOptions } from './typeorm.config';
import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
// import fs from 'fs';
// import path from 'path';

// const clientCertStag = [];
// const clientKeyStag = [];
// const serverCaStag = [];

// const clientCertProd = fs.readFileSync(
//     path.join(__dirname, '../../../ssl/database/prod/client-cert.pem'),
// );
// const clientKeyProd = fs.readFileSync(
//     path.join(__dirname, '../../../ssl/database/prod/client-key.pem'),
// );
// const serverCaProd = fs.readFileSync(
//     path.join(__dirname, '../../../ssl/database/prod/server-ca.pem'),
// );

export const configDb = registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        ...dataSourceOptions,
    }),
);

export const configQueue = registerAs(
    'queue',
    (): BullRootModuleOptions => ({
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASS ?? null,
        },
    }),
);
