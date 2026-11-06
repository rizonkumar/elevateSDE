import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AddStudyGroupMembersRequest,
  CreateStudyGroupRequest,
  STUDY_GROUP_LIMITS,
  StudyGoalMetric,
  StudyGoalScope,
  StudyGroupGoalInput,
  StudyGroupJoinPolicy,
  StudyGroupLeaderboardWindow,
  StudyGroupRole,
  UpdateStudyGroupMemberRequest,
  UpdateStudyGroupRequest,
} from '@elevatesde/shared-types';

const JOIN_POLICIES: StudyGroupJoinPolicy[] = ['OPEN', 'INVITE_ONLY'];
const ROLES: StudyGroupRole[] = ['OWNER', 'MEMBER'];
const METRICS: StudyGoalMetric[] = [
  'PROBLEMS_SOLVED',
  'POINTS',
  'DAILY_CHALLENGES',
  'CONTESTS_ENTERED',
];
const SCOPES: StudyGoalScope[] = ['GROUP_TOTAL', 'EACH_MEMBER'];
const WINDOWS: StudyGroupLeaderboardWindow[] = ['goal', 'week', 'all'];

export class CreateStudyGroupDto implements CreateStudyGroupRequest {
  @ApiProperty({ example: 'Spring 2027 cohort' })
  @IsString()
  @MaxLength(STUDY_GROUP_LIMITS.nameMaxLength * 2)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(STUDY_GROUP_LIMITS.descriptionMaxLength * 2)
  description?: string | null;

  @ApiProperty({ enum: JOIN_POLICIES })
  @IsIn(JOIN_POLICIES)
  joinPolicy!: StudyGroupJoinPolicy;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  ownerIds?: string[];
}

export class UpdateStudyGroupDto implements UpdateStudyGroupRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(STUDY_GROUP_LIMITS.nameMaxLength * 2)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(STUDY_GROUP_LIMITS.descriptionMaxLength * 2)
  description?: string | null;

  @ApiPropertyOptional({ enum: JOIN_POLICIES })
  @IsOptional()
  @IsIn(JOIN_POLICIES)
  joinPolicy?: StudyGroupJoinPolicy;
}

export class AddStudyGroupMembersDto implements AddStudyGroupMembersRequest {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(STUDY_GROUP_LIMITS.maxMembers)
  @IsUUID('4', { each: true })
  userIds!: string[];
}

export class UpdateStudyGroupMemberDto implements UpdateStudyGroupMemberRequest {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: StudyGroupRole;
}

export class StudyGroupGoalDto implements StudyGroupGoalInput {
  @ApiProperty({ example: 'Solve 100 problems together' })
  @IsString()
  @MaxLength(STUDY_GROUP_LIMITS.goalTitleMaxLength * 2)
  title!: string;

  @ApiProperty({ enum: METRICS })
  @IsIn(METRICS)
  metric!: StudyGoalMetric;

  @ApiProperty({ enum: SCOPES })
  @IsIn(SCOPES)
  scope!: StudyGoalScope;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  target!: number;

  @ApiProperty({ example: '2027-03-01T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2027-03-31T00:00:00.000Z' })
  @IsDateString()
  endsAt!: string;
}

export class StudyGroupLeaderboardQueryDto {
  @ApiPropertyOptional({ enum: WINDOWS, default: 'goal' })
  @IsOptional()
  @IsIn(WINDOWS)
  window?: StudyGroupLeaderboardWindow;
}

export class RosterCandidatesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
