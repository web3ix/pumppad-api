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

export class GetMyTokensDto {
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

    @ApiProperty({
        name: 'owner',
        type: String,
        description: 'Owner address of token',
    })
    @IsString()
    owner: string;
}
