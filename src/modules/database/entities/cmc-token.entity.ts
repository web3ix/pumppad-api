import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CHAIN_ID } from '../../blockchain/configs';
import { BaseEntity } from './base.entity';
import { NetworkEntity } from './network.entity';

@Entity('cmc_token')
@Unique('cmc_tokens_unique', ['cmcId'])
export class TokenEntity extends BaseEntity {
    @Column({
        enum: CHAIN_ID,
    })
    chainId: CHAIN_ID;

    // @ManyToOne(() => NetworkEntity, (entity) => entity.tokens)
    // @JoinColumn({
    //     name: 'chainId',
    //     referencedColumnName: 'chainId',
    // })
    // network: NetworkEntity;

    @Column({ default: '' })
    address: string;

    @Column({ default: '' })
    name: string;

    @Column({ default: '' })
    symbol: string;

    @Column({ default: '' })
    decimals: string;

    @Column()
    cmcId: number;
}
