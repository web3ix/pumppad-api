import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TokenEntity } from './token.entity';

@Entity('sell')
export class SellEntity extends BaseEntity {
    @ManyToOne(() => TokenEntity, (user) => user.sells)
    token: TokenEntity;

    @Column()
    user: string;

    @Column()
    receiver: string;

    @Column()
    amountBurned: string;

    @Column()
    reserveToken: string;

    @Column()
    refundAmount: string;
}
