import { Module } from '@nestjs/common';
import { configDb } from './configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    NetworkConfigRepository,
    NetworkRepository,
    TradeRepository,
    TokenRepository,
    MetadataRepository,
    CommentRepository,
} from './repositories';

import { entities } from './configs/typeorm.config';

const repositories = [
    NetworkConfigRepository,
    NetworkRepository,
    TokenRepository,
    TradeRepository,
    MetadataRepository,
    CommentRepository,
];

const services = [];

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            expandVariables: true,
            load: [configDb],
        }),
        TypeOrmModule.forRootAsync({
            useFactory: (config: ConfigService) => config.get('database'),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(entities),
    ],
    providers: [...repositories, ...services],
    exports: [...repositories, ...services],
})
export class DatabaseModule {}
