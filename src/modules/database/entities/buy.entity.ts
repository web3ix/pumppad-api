import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TokenEntity } from './token.entity';

@Entity('buy')
export class BuyEntity extends BaseEntity {
    @ManyToOne(() => TokenEntity, (user) => user.buys)
    token: TokenEntity;

    @Column()
    user: string;

    @Column()
    receiver: string;

    @Column()
    amountMinted: string;

    @Column()
    reserveToken: string;

    @Column()
    reserveAmount: string;
}
