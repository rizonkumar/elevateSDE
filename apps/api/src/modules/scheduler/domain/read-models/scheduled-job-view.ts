import { ScheduledJobName } from '../scheduled-jobs';

export interface ScheduledJobView {
  name: ScheduledJobName;
  pattern: string;
}
