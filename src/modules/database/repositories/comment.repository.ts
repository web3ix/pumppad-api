import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CommentEntity } from '@/database/entities';

export class CommentRepository extends Repository<CommentEntity> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(CommentEntity, dataSource.createEntityManager());
    }
}
