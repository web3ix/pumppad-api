import { Module } from '@nestjs/common';
import { ApiModule } from '@/api';

@Module({
    imports: [ApiModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
