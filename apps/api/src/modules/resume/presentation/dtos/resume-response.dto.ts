import { ApiProperty } from '@nestjs/swagger';
import { ResumeDto, ResumeFeedbackItem, ResumeStatus } from '@elevatesde/shared-types';

export class ResumeFeedbackItemResponseDto implements ResumeFeedbackItem {
  @ApiProperty({ example: 'Quantified impact found' })
  title!: string;

  @ApiProperty({ example: 'Numbers and percentages help recruiters gauge your impact quickly.' })
  detail!: string;

  @ApiProperty({ example: 'good', enum: ['good', 'warning', 'critical'] })
  severity!: 'good' | 'warning' | 'critical';
}

export class ResumeResponseDto implements ResumeDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId!: string;

  @ApiProperty({ example: 'jane-doe-resume.pdf' })
  fileName!: string;

  @ApiProperty({ example: null, nullable: true })
  fileUrl!: string | null;

  @ApiProperty({ example: 'PROCESSING', enum: ['PROCESSING', 'COMPLETED', 'FAILED'] })
  status!: ResumeStatus;

  @ApiProperty({ example: 82, nullable: true })
  atsScore!: number | null;

  @ApiProperty({ type: [String], example: ['TypeScript', 'React'] })
  parsedSkills!: string[];

  @ApiProperty({ type: [String], example: ['Kubernetes', 'GraphQL'] })
  missingSkills!: string[];

  @ApiProperty({ type: [ResumeFeedbackItemResponseDto] })
  structureFeedback!: ResumeFeedbackItemResponseDto[];

  @ApiProperty({ type: [String] })
  actionableTips!: string[];

  @ApiProperty({ example: 'Strong ATS alignment with 8 relevant skills detected.', nullable: true })
  summary!: string | null;

  @ApiProperty({ example: '2026-08-11T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-11T09:30:04.000Z' })
  updatedAt!: string;
}
