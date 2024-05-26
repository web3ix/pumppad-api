import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { SellEntity } from '@/database/entities';

export class SellRepository extends Repository<SellEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(SellEntity, dataSource.createEntityManager());
    }
}
