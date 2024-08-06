import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TradeEntity } from '@/database/entities';

export class TradeRepository extends Repository<TradeEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(TradeEntity, dataSource.createEntityManager());
    }
}
