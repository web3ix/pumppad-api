import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { BuyEntity } from '@/database/entities';

export class BuyRepository extends Repository<BuyEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(BuyEntity, dataSource.createEntityManager());
    }
}
