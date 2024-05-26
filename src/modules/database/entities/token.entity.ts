import { Column, Entity, OneToMany } from 'typeorm';
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

    @Column({ nullable: true })
    description: string;

    @Column({ default: '' })
    reserveToken: string;

    @Column({ nullable: true })
    image: string;

    @Column({ nullable: true })
    twitterLink: string;

    @Column({ nullable: true })
    telegramLink: string;

    @Column({ nullable: true })
    website: string;

    @OneToMany(() => BuyEntity, (buy) => buy.token)
    buys: BuyEntity[];

    @OneToMany(() => SellEntity, (sell) => sell.token)
    sells: SellEntity[];
}
