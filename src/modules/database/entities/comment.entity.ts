import { Column, Entity, ManyToOne } from 'typeorm';
import { METADATA_TYPE } from '../configs';
import { BaseEntity } from './base.entity';
import { TokenEntity } from './token.entity';

@Entity('comment')
export class CommentEntity extends BaseEntity {
    @ManyToOne(() => TokenEntity, (user) => user.comments)
    token: TokenEntity;

    @Column()
    address: string;

    @Column()
    text: string;

    @Column()
    timestamp: number;
}
