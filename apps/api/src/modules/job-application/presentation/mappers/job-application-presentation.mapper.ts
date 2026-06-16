import { JobApplication } from '../../domain/entities/job-application';
import { JobApplicationResponseDto } from '../dtos/job-application-response.dto';

export class JobApplicationPresentationMapper {
  static toResponse(jobApplication: JobApplication): JobApplicationResponseDto {
    const interviewDate = jobApplication.getInterviewDate();
    const dto = new JobApplicationResponseDto();
    dto.id = jobApplication.getId();
    dto.userId = jobApplication.getUserId();
    dto.company = jobApplication.getCompany();
    dto.role = jobApplication.getRole();
    dto.status = jobApplication.getStatus();
    dto.salaryRange = jobApplication.getSalaryRange();
    dto.jobDescriptionUrl = jobApplication.getJobDescriptionUrl();
    dto.interviewDate = interviewDate ? interviewDate.toISOString() : null;
    dto.boardPosition = jobApplication.getBoardPosition();
    dto.createdAt = jobApplication.getCreatedAt().toISOString();
    dto.updatedAt = jobApplication.getUpdatedAt().toISOString();
    return dto;
  }
}
