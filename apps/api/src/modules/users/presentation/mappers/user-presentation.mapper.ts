import { User } from '../../domain/entities/user';
import { UserResponseDto } from '../dtos/user-response.dto';

export class UserPresentationMapper {
  static toResponse(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.getId();
    dto.email = user.getEmail();
    dto.handle = user.getHandle();
    dto.tenantId = user.getTenantId();
    dto.firstName = user.getFirstName();
    dto.lastName = user.getLastName();
    dto.headline = user.getHeadline();
    dto.bio = user.getBio();
    dto.isProfilePublic = user.isPublicProfile();
    dto.githubUrl = user.getGithubUrl();
    dto.linkedinUrl = user.getLinkedinUrl();
    dto.websiteUrl = user.getWebsiteUrl();
    dto.role = user.getRole();
    dto.createdAt = user.getCreatedAt().toISOString();
    return dto;
  }
}
