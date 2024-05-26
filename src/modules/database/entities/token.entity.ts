import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BuyEntity } from './buy.entity';
import { SellEntity } from './sell.entity';

@Entity('token')
export class TokenEntity extends BaseEntity {
    @Column({ default: '' })
    token: string;

    @Column({ default: '' })
    name: string;

    @Column({ default: '' })
    symbol: string;

    @Column({ default: 18 })
    decimals: number;

    @Column()
    description: string;

    @Column({ default: '' })
    reserveToken: string;

    @Column()
    image: string;

    @Column()
    twitterLink: string;

    @Column()
    telegramLink: string;

    @Column()
    website: string;

    @OneToMany(() => BuyEntity, (buy) => buy.token)
    buys: BuyEntity[];

    @OneToMany(() => SellEntity, (sell) => sell.token)
    sells: SellEntity[];
}
