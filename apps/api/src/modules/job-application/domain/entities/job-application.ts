import { JobApplicationStatus } from '@prisma/client';

export interface JobApplicationDetails {
  company: string;
  role: string;
  status: JobApplicationStatus;
  salaryRange: string | null;
  jobDescriptionUrl: string | null;
  interviewDate: Date | null;
}

export class JobApplication {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly company: string,
    private readonly role: string,
    private readonly status: JobApplicationStatus,
    private readonly salaryRange: string | null,
    private readonly jobDescriptionUrl: string | null,
    private readonly interviewDate: Date | null,
    private readonly boardPosition: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    details: JobApplicationDetails,
    boardPosition: number,
  ): JobApplication {
    if (!isNonEmpty(details.company)) {
      throw new Error('Company name cannot be empty');
    }
    if (!isNonEmpty(details.role)) {
      throw new Error('Role cannot be empty');
    }
    const now = new Date();
    return new JobApplication(
      id,
      userId,
      details.company,
      details.role,
      details.status,
      details.salaryRange,
      details.jobDescriptionUrl,
      details.interviewDate,
      boardPosition,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    userId: string,
    company: string,
    role: string,
    status: JobApplicationStatus,
    salaryRange: string | null,
    jobDescriptionUrl: string | null,
    interviewDate: Date | null,
    boardPosition: number,
    createdAt: Date,
    updatedAt: Date,
  ): JobApplication {
    return new JobApplication(
      id,
      userId,
      company,
      role,
      status,
      salaryRange,
      jobDescriptionUrl,
      interviewDate,
      boardPosition,
      createdAt,
      updatedAt,
    );
  }

  updateDetails(details: Partial<JobApplicationDetails>): JobApplication {
    return new JobApplication(
      this.id,
      this.userId,
      details.company ?? this.company,
      details.role ?? this.role,
      details.status ?? this.status,
      details.salaryRange !== undefined ? details.salaryRange : this.salaryRange,
      details.jobDescriptionUrl !== undefined ? details.jobDescriptionUrl : this.jobDescriptionUrl,
      details.interviewDate !== undefined ? details.interviewDate : this.interviewDate,
      this.boardPosition,
      this.createdAt,
      new Date(),
    );
  }

  moveTo(status: JobApplicationStatus, boardPosition: number): JobApplication {
    return new JobApplication(
      this.id,
      this.userId,
      this.company,
      this.role,
      status,
      this.salaryRange,
      this.jobDescriptionUrl,
      this.interviewDate,
      boardPosition,
      this.createdAt,
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getCompany(): string {
    return this.company;
  }

  getRole(): string {
    return this.role;
  }

  getStatus(): JobApplicationStatus {
    return this.status;
  }

  getSalaryRange(): string | null {
    return this.salaryRange;
  }

  getJobDescriptionUrl(): string | null {
    return this.jobDescriptionUrl;
  }

  getInterviewDate(): Date | null {
    return this.interviewDate;
  }

  getBoardPosition(): number {
    return this.boardPosition;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

function isNonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
