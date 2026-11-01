import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { UserRole } from '@prisma/client';
import {
  PendingAccountCountDto,
  PendingAccountDto,
  PendingAccountListDto,
} from '@elevatesde/shared-types';

export class PendingAccountQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}

export class RejectAccountDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class PendingAccountResponseDto implements PendingAccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: string;

  @ApiPropertyOptional({ nullable: true })
  companyName!: string | null;

  @ApiProperty({ enum: ['PASSWORD', 'GOOGLE'] })
  signUpMethod!: 'PASSWORD' | 'GOOGLE';

  @ApiProperty()
  createdAt!: string;
}

export class PendingAccountListResponseDto implements PendingAccountListDto {
  @ApiProperty({ type: [PendingAccountResponseDto] })
  items!: PendingAccountResponseDto[];

  @ApiProperty()
  total!: number;
}

export class PendingAccountCountResponseDto implements PendingAccountCountDto {
  @ApiProperty()
  count!: number;
}
