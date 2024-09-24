import {
    DEFAULT_PAGINATION_TAKEN,
    MAX_PAGINATION_TAKEN,
    MIN_PAGINATION_TAKEN,
} from '@/shared/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsNumber,
    IsOptional,
    Max,
    Min,
    IsEnum,
    IsString,
} from 'class-validator';

export enum EGetTokenSortBy {
    TRENDING = 'trending',
    TOP = 'top',
    RAISING = 'raising',
    NEW = 'new',
    FINISHED = 'finished',
}

export enum EGetTokenAge {
    LESS_THAN_1H = 'less_than_1h',
    LESS_THAN_6h = 'less_than_6',
    LESS_THAN_1D = 'less_than_1D',
    LESS_THAN_1W = 'less_than_1W',
    ALL = 'all',
}

export class GetTokensDto {
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
        name: 'skip',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    skip?: number = 0;

    @ApiPropertyOptional({
        name: 'sortBy',
        enum: EGetTokenSortBy,
    })
    @IsOptional()
    @IsEnum(EGetTokenSortBy)
    sortBy?: EGetTokenSortBy = EGetTokenSortBy.TRENDING;

    @ApiPropertyOptional({
        name: 'search',
        type: String,
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        name: 'owner',
        type: String,
        description: 'Owner address of token',
    })
    @IsString()
    @IsOptional()
    owner?: string;

    @ApiPropertyOptional({
        name: 'user',
        type: String,
        description: 'User address that trade token',
    })
    @IsString()
    @IsOptional()
    user?: string;

    @ApiPropertyOptional({
        name: 'age',
        enum: EGetTokenAge,
    })
    @IsEnum(EGetTokenAge)
    @IsOptional()
    age?: EGetTokenAge;

    @ApiPropertyOptional({
        name: 'minProgress',
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minProgress?: EGetTokenAge;

    @ApiPropertyOptional({
        name: 'maxProgress',
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxProgress?: EGetTokenAge;
}
