import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TradeEntity } from './trade.entity';
import { CommentEntity } from './comment.entity';

@Entity('token')
export class TokenEntity extends BaseEntity {
    @Column()
    token: string;

    @Column()
    creator: string;

    @Column({ default: false })
    activated: boolean;

    @Column()
    name: string;

    @Column()
    symbol: string;

    @Column()
    uri: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ nullable: true })
    banner: string;

    @Column({ nullable: true })
    desc: string;

    @Column({ type: 'simple-json', default: {} })
    link: {
        website?: string;
        twitter?: string;
        telegram?: string;
        discord?: string;
        link1?: string;
        link2?: string;
    };

    @Column()
    timestamp: number;

    @Column({ type: 'decimal', nullable: true })
    lastPrice: number;

    @OneToMany(() => TradeEntity, (entity) => entity.token)
    trades: TradeEntity[];

    @OneToMany(() => CommentEntity, (entity) => entity.token)
    comments: CommentEntity[];
}
