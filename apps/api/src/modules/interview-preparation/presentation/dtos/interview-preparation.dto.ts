import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type {
  CreateInterviewPreparationPlanDto as CreatePlanContract,
  CreatePeerPracticeSessionDto as CreatePeerSessionContract,
  CreatePreparationRoundDto as CreateRoundContract,
  CreatePreparationTaskDto as CreateTaskContract,
  InterviewPreparationArchetype,
  InterviewPreparationPlanStatus,
  InterviewRoundType,
  PeerPracticeStatus,
  PreparationResourceType,
  PreparationTaskType,
  ReschedulePeerPracticeSessionDto as ReschedulePeerSessionContract,
  SubmitPeerScorecardDto as SubmitPeerScorecardContract,
  UpdateInterviewPreparationPlanDto as UpdatePlanContract,
  UpdatePreparationRoundDto as UpdateRoundContract,
  UpdatePreparationTaskDto as UpdateTaskContract,
} from '@elevatesde/shared-types';

const ARCHETYPES: InterviewPreparationArchetype[] = ['GENERAL', 'FAANG', 'STARTUP', 'ENTERPRISE'];
const ROUND_TYPES: InterviewRoundType[] = ['CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'RESUME_ROLE_FIT', 'CUSTOM'];
const PLAN_STATUSES: InterviewPreparationPlanStatus[] = ['ACTIVE', 'ARCHIVED', 'COMPLETED'];
const TASK_TYPES: PreparationTaskType[] = ['SOLVE_PROBLEM', 'REVIEW_PROBLEM', 'COMPLETE_PATH', 'ANALYZE_RESUME', 'RUN_MOCK_INTERVIEW', 'SCHEDULE_PEER_PRACTICE', 'CUSTOM'];
const RESOURCE_TYPES: PreparationResourceType[] = ['PROBLEM', 'PROBLEM_COLLECTION', 'LEARNING_PATH', 'REVIEW_QUEUE', 'RESUME_ANALYSIS', 'MOCK_INTERVIEW', 'PEER_SESSION'];
const PEER_UPDATE_STATUSES: Array<Exclude<PeerPracticeStatus, 'PENDING'>> = ['ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

export class PreparationRoundInputDto {
  @IsIn(ROUND_TYPES)
  type!: InterviewRoundType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  weight!: number;
}

export class CreateInterviewPreparationPlanRequestDto implements CreatePlanContract {
  @IsString()
  @IsNotEmpty()
  jobApplicationId!: string;

  @IsDateString()
  targetAt!: string;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @IsIn(ARCHETYPES)
  archetype!: InterviewPreparationArchetype;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PreparationRoundInputDto)
  rounds!: PreparationRoundInputDto[];
}

export class UpdateInterviewPreparationPlanRequestDto implements UpdatePlanContract {
  @IsDateString()
  @IsOptional()
  targetAt?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  timeZone?: string;

  @IsIn(ARCHETYPES)
  @IsOptional()
  archetype?: InterviewPreparationArchetype;

  @IsIn(PLAN_STATUSES)
  @IsOptional()
  status?: InterviewPreparationPlanStatus;

  @IsInt()
  @Min(0)
  version!: number;
}

export class CreatePreparationRoundRequestDto implements CreateRoundContract {
  @IsIn(ROUND_TYPES)
  type!: InterviewRoundType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  weight!: number;

  @IsInt()
  @Min(0)
  ordinal!: number;
}

export class UpdatePreparationRoundRequestDto implements UpdateRoundContract {
  @IsIn(ROUND_TYPES)
  @IsOptional()
  type?: InterviewRoundType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  @IsOptional()
  weight?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordinal?: number;

  @IsInt()
  @Min(0)
  version!: number;
}

export class CreatePreparationTaskRequestDto implements CreateTaskContract {
  @IsString()
  @IsNotEmpty()
  roundId!: string;

  @IsIn(TASK_TYPES)
  type!: PreparationTaskType;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string | null;

  @IsDateString()
  @IsOptional()
  dueAt?: string | null;

  @IsIn(RESOURCE_TYPES)
  @IsOptional()
  resourceType?: PreparationResourceType | null;

  @IsString()
  @IsOptional()
  resourceId?: string | null;

  @IsString()
  @IsOptional()
  deepLink?: string | null;

  @IsInt()
  @Min(0)
  ordinal!: number;
}

export class UpdatePreparationTaskRequestDto implements UpdateTaskContract {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string | null;

  @IsDateString()
  @IsOptional()
  dueAt?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordinal?: number;

  @IsInt()
  @Min(0)
  version!: number;
}

export class VersionRequestDto {
  @IsInt()
  @Min(0)
  version!: number;
}

export class CreatePeerPracticeSessionRequestDto implements CreatePeerSessionContract {
  @IsString()
  @IsNotEmpty()
  roundId!: string;

  @IsEmail()
  inviteeEmail!: string;

  @IsDateString()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes!: number;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  meetingUrl!: string;
}

export class ReschedulePeerPracticeSessionRequestDto implements ReschedulePeerSessionContract {
  @IsDateString()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes!: number;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  meetingUrl!: string;

  @IsInt()
  @Min(0)
  version!: number;
}

export class UpdatePeerPracticeStatusRequestDto {
  @IsIn(PEER_UPDATE_STATUSES)
  status!: Exclude<PeerPracticeStatus, 'PENDING'>;

  @IsInt()
  @Min(0)
  version!: number;
}

export class SubmitPeerScorecardRequestDto implements SubmitPeerScorecardContract {
  @IsInt()
  @Min(0)
  @Max(100)
  communication!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  problemSolving!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  technicalDepth!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  structure!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  strengths!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  improvements!: string[];
}
