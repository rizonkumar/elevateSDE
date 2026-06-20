import { Submission } from '../entities/submission';

export abstract class ISubmissionRepository {
  abstract save(submission: Submission): Promise<Submission>;
  abstract findByUserAndProblem(userId: string, problemId: string): Promise<Submission[]>;
}
