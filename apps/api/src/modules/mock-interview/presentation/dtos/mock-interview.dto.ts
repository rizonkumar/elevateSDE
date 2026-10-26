import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MOCK_INTERVIEW_DURATIONS,
  MOCK_INTERVIEW_MAX_ANSWER_LENGTH,
  type InterviewCompanyStyle,
  type InterviewRoleLevel,
  type MockInterviewTopic,
  type StartMockInterviewDto as StartContract,
  type SubmitMockInterviewAnswerDto as SubmitAnswerContract,
} from '@elevatesde/shared-types';

const TOPICS: MockInterviewTopic[] = ['SYSTEM_DESIGN', 'BEHAVIORAL', 'CODING', 'DSA'];
const ROLE_LEVELS: InterviewRoleLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'STAFF'];
const COMPANY_STYLES: InterviewCompanyStyle[] = ['GENERIC', 'FAANG', 'STARTUP', 'ENTERPRISE'];

export class StartMockInterviewRequestDto implements StartContract {
  @IsIn(TOPICS)
  topic!: MockInterviewTopic;

  @IsIn(ROLE_LEVELS)
  roleLevel!: InterviewRoleLevel;

  @IsIn(COMPANY_STYLES)
  companyStyle!: InterviewCompanyStyle;

  @Type(() => Number)
  @IsIn([...MOCK_INTERVIEW_DURATIONS])
  durationMinutes!: number;

  @IsOptional()
  @IsUUID()
  preparationTaskId?: string;
}

export class SubmitMockInterviewAnswerRequestDto implements SubmitAnswerContract {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MOCK_INTERVIEW_MAX_ANSWER_LENGTH)
  answer!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  version!: number;
}

export class MockInterviewHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
