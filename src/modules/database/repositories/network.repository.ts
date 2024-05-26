import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { NetworkEntity } from '@/database/entities';

export class NetworkRepository extends Repository<NetworkEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(NetworkEntity, dataSource.createEntityManager());
    }
}
