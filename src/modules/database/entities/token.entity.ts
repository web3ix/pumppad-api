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

    @Column({ default: false })
    completed: boolean;

    @Column()
    name: string;

    @Column()
    symbol: string;

    @Column()
    uri: string;

    @Column()
    icon: string;

    @Column()
    banner: string;

    @Column()
    desc: string;

    @Column()
    supplied: string;

    @Column()
    reserve: string;

    @Column({ type: 'decimal' })
    parsedSupplied: number;

    @Column({ type: 'decimal' })
    parsedReserve: number;

    @Column({ type: 'simple-json', default: {} })
    tokenomics: {
        name1?: string;
        ratio1?: number;
        recipient1?: string;
        name2?: string;
        ratio2?: number;
        recipient2?: string;
        name3?: string;
        ratio3?: number;
        recipient3?: string;
    };

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
