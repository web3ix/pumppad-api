import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('network-config')
export class NetworkConfigEntity extends BaseEntity {
    @Column({ unique: true })
    @Index()
    key: string;

    @Column({ type: 'simple-json', default: {} })
    data: {
        numberBlock: number;
        runAt?: number;
        isRunning?: boolean;
        stop?: boolean;
        startBlock?: number;
        endBlock?: number;
        startSignature?: string;
        endSignature?: string;
    };
}
