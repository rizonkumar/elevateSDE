import { Submission } from '../entities/submission';

export abstract class ISubmissionRepository {
  abstract save(submission: Submission): Promise<Submission>;
  abstract update(submission: Submission): Promise<Submission>;
  abstract findById(id: string): Promise<Submission | null>;
  abstract findByUserAndProblem(userId: string, problemId: string): Promise<Submission[]>;
}
