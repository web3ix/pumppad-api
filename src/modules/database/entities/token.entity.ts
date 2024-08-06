import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TradeEntity } from './trade.entity';

@Entity('token')
export class TokenEntity extends BaseEntity {
    @Column()
    token: string;

    @Column()
    creator: string;

    @Column({ default: 0, nullable: true })
    stepId: number;

    @Column({ default: false })
    activated: boolean;

    @Column()
    name: string;

    @Column()
    symbol: string;

    @Column()
    uri: string;

    @Column()
    timestamp: number;

    @Column({ type: 'decimal', nullable: true })
    lastPrice: number;

    @OneToMany(() => TradeEntity, (buy) => buy.token)
    trades: TradeEntity[];
}
