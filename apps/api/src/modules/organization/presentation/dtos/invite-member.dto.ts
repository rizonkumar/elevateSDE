import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'teammate@company.com' })
  @IsEmail()
  email!: string;
}
