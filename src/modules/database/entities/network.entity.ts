import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('network')
export class NetworkEntity extends BaseEntity {
    @Column({ nullable: true })
    name: string;

    @Column({ unique: true })
    @Index()
    chainId: number;

    @Column({ default: '' })
    url: string;

    @Column({ default: '' })
    explorerUrl: string;

    @Column({ default: '' })
    icon: string;
}
