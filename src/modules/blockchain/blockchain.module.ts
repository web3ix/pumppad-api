import { DatabaseModule } from '@/database';
import { Module } from '@nestjs/common';
import { EvmService } from './services';

const services = [EvmService];

@Module({
    imports: [DatabaseModule],
    controllers: [],
    providers: [...services],
    exports: [...services],
})
export class BlockchainModule {}
