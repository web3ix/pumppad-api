import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { AuthController } from '@/api/controllers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
    AuthService,
    ConsumerService,
    PumpService,
    ScheduleService,
} from '@/api/services';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { configQueue } from '@/database/configs';
import { BlockchainModule } from '@/blockchain';

const controllers = [AuthController];

const services = [AuthService, ScheduleService, ConsumerService, PumpService];

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
