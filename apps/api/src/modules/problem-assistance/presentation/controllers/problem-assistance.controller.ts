import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemAssistanceService } from '../../application/problem-assistance.service';
import { ProblemAssistanceResponseDto } from '../dtos/problem-assistance-response.dto';
import { ProblemEditorialResponseDto } from '../dtos/problem-editorial-response.dto';
import { ProblemAssistancePresentationMapper } from '../mappers/problem-assistance-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Problem Assistance')
@ApiBearerAuth()
@Controller({ path: 'problems', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProblemAssistanceController {
  constructor(private readonly assistanceService: ProblemAssistanceService) {}

  @Get(':id/assistance')
  @ApiOperation({ summary: 'Get revealed hints and editorial availability for a problem' })
  @ApiResponse({ status: 200, type: ProblemAssistanceResponseDto })
  async getAssistance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemAssistanceResponseDto> {
    const view = await this.assistanceService.getAssistance(req.user.getId(), id);
    return ProblemAssistancePresentationMapper.toAssistanceResponse(view);
  }

  @Post(':id/hints/reveal')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reveal the next hint for a problem' })
  @ApiResponse({ status: 200, type: ProblemAssistanceResponseDto })
  @ApiResponse({ status: 403, description: 'Locked during a live contest.' })
  @ApiResponse({ status: 409, description: 'No hints left.' })
  async revealHint(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemAssistanceResponseDto> {
    const view = await this.assistanceService.revealNextHint(req.user.getId(), id);
    return ProblemAssistancePresentationMapper.toAssistanceResponse(view);
  }

  @Post(':id/editorial/unlock')
  @HttpCode(200)
  @ApiOperation({ summary: 'Give up on a problem and unlock its editorial' })
  @ApiResponse({ status: 200, type: ProblemAssistanceResponseDto })
  @ApiResponse({ status: 403, description: 'Locked during a live contest.' })
  @ApiResponse({ status: 404, description: 'No published editorial.' })
  async unlockEditorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemAssistanceResponseDto> {
    const view = await this.assistanceService.giveUp(req.user.getId(), id);
    return ProblemAssistancePresentationMapper.toAssistanceResponse(view);
  }

  @Get(':id/editorial')
  @ApiOperation({ summary: 'Get the editorial for a problem once it is unlocked' })
  @ApiResponse({ status: 200, type: ProblemEditorialResponseDto })
  @ApiResponse({ status: 403, description: 'Editorial is locked.' })
  @ApiResponse({ status: 404, description: 'No published editorial.' })
  async getEditorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemEditorialResponseDto> {
    const view = await this.assistanceService.getEditorial(req.user.getId(), id);
    return ProblemAssistancePresentationMapper.toEditorialResponse(view);
  }
}
