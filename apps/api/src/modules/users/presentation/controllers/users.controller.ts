import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../../application/users.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { User } from '../../domain/entities/user';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserPresentationMapper } from '../mappers/user-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current logged in user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'Return current user details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@Req() req: RequestWithUser): UserResponseDto {
    return UserPresentationMapper.toResponse(req.user);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'User role successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    if (req.user.getId() === id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const updatedUser = await this.usersService.updateRole(id, role);
    return UserPresentationMapper.toResponse(updatedUser);
  }
}
