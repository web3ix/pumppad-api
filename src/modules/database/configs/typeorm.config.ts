import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import {
    NetworkConfigEntity,
    NetworkEntity,
    TokenEntity,
    TradeEntity,
} from '../entities';
import { InitDB1722937546265 } from '../migrations/1722937546265-InitDB';
import { SeedDB1722937553644 } from '../migrations/1722937553644-SeedDB';
import { AddStep1722940061789 } from '../migrations/1722940061789-AddStep';
import { AddSign1722940789718 } from '../migrations/1722940789718-AddSign';

config();

const configService = new ConfigService();

export const entities = [
    NetworkConfigEntity,
    NetworkEntity,
    TokenEntity,
    TradeEntity,
];

const migrations = [
    InitDB1722937546265,
    SeedDB1722937553644,
    AddStep1722940061789,
    AddSign1722940789718,
];

export const dbConfig = {
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT') ?? '5432', 10),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
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
    ssl: false,
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
