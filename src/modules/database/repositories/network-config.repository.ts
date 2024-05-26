import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { NetworkConfigEntity } from '@/database/entities';

export class NetworkConfigRepository extends Repository<NetworkConfigEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(NetworkConfigEntity, dataSource.createEntityManager());
    }
}
