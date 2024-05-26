import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import {
    MAX_PAGINATION_TAKEN,
    MIN_PAGINATION_TAKEN,
    DEFAULT_PAGINATION_TAKEN,
} from '@/shared/constants';
import { ESortType } from '@/shared/constants/enum';

export interface IPaginate {
    take?: number;
    page?: number;
}

export class PaginateDto implements IPaginate {
    @ApiPropertyOptional({
        name: 'take',
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Max(MAX_PAGINATION_TAKEN)
    @Min(MIN_PAGINATION_TAKEN)
    take?: number = DEFAULT_PAGINATION_TAKEN;

    @ApiPropertyOptional({
        name: 'page',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        name: 'chainId',
    })
    chainId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    sort_field?: string = 'created_at';

    @ApiPropertyOptional({
        type: 'enum',
        enum: ESortType,
    })
    @IsOptional()
    sort_type?: ESortType;
}
