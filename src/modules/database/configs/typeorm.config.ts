import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import {
    CommentEntity,
    MetadataEntity,
    NetworkConfigEntity,
    NetworkEntity,
    TokenEntity,
    TradeEntity,
} from '../entities';
import { InitDB1726551687048 } from '../migrations/1726551687048-InitDB';
import { SeedDB1726551701922 } from '../migrations/1726551701922-SeedDB';
import { AddTokennomics1726552602299 } from '../migrations/1726552602299-AddTokennomics';
import { AddCommentTimestamp1726853234485 } from '../migrations/1726853234485-AddCommentTimestamp';

config();

const configService = new ConfigService();

export const entities = [
    NetworkConfigEntity,
    NetworkEntity,
    TokenEntity,
    TradeEntity,
    MetadataEntity,
    CommentEntity,
];

const migrations = [
    InitDB1726551687048,
    SeedDB1726551701922,
    AddTokennomics1726552602299,
    AddCommentTimestamp1726853234485,
];

export const dbConfig = {
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT') ?? '5432', 10),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    ssl: configService.get('DB_SSL') === 'true' ? true : false,
};

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [...entities],
    migrations: [...migrations],
    logging: false,
    ssl: dbConfig.ssl,
    // TODO add db ssl in prod
    // ssl:
    //     process.env.APP_ENV == 'production'
    //         ? {
    //               ca:
    //                   process.env.APP_ENV == 'production'
    //                       ? serverCaProd
    //                       : serverCaStag,
    //               key:
    //                   process.env.APP_ENV == 'production'
    //                       ? clientKeyProd
    //                       : clientKeyStag,
    //               cert:
    //                   process.env.APP_ENV == 'production'
    //                       ? clientCertProd
    //                       : clientCertStag,
    //               rejectUnauthorized: false,
    //           }
    //         : false,
};

export default new DataSource(dataSourceOptions);
