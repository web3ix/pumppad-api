import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TokenEntity } from './token.entity';

@Entity('trade')
export class TradeEntity extends BaseEntity {
    @ManyToOne(() => TokenEntity, (user) => user.trades)
    token: TokenEntity;

    @Column({ nullable: true })
    signature: string;

    @Column()
    isBuy: boolean;

    @Column()
    doer: string;

    @Column()
    amount: string;

    @Column()
    reserveAmount: string;

    @Column({ type: 'decimal' })
    parseAmount: number;

    @Column({ type: 'decimal' })
    parseReserveAmount: number;

    @Column()
    timestamp: number;
}
