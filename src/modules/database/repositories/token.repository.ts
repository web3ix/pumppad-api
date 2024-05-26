import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TokenEntity } from '@/database/entities';

export class TokenRepository extends Repository<TokenEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(TokenEntity, dataSource.createEntityManager());
    }
}
