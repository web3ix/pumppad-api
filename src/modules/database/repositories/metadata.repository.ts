import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { MetadataEntity } from '@/database/entities';

export class MetadataRepository extends Repository<MetadataEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(MetadataEntity, dataSource.createEntityManager());
    }
}
