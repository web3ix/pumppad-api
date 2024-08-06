import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { AuthController } from '@/api/controllers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
    AuthService,
    ConsumerService,
    BondService,
    ScheduleService,
} from '@/api/services';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { configQueue } from '@/database/configs';
import { BlockchainModule } from '@/blockchain';
import { BondController } from './controllers/bond.controller';

const controllers = [AuthController, BondController];

const services = [AuthService, ScheduleService, ConsumerService, BondService];

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            expandVariables: true,
            load: [configQueue],
        }),
        ScheduleModule.forRoot(),
        BullModule.forRootAsync({
            useFactory: (config: ConfigService) => config.get('queue'),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'QUEUE',
        }),
        BlockchainModule,
        DatabaseModule,
    ],
    controllers: [...controllers],
    providers: [...services],
})
export class ApiModule {}
