import { Column, Entity } from 'typeorm';
import { METADATA_TYPE } from '../configs';
import { BaseEntity } from './base.entity';

@Entity('metadata')
export class MetadataEntity extends BaseEntity {
    @Column()
    key: string;

    @Column({ enum: METADATA_TYPE })
    type: METADATA_TYPE;

    @Column()
    uri: string;
}
