import { RunSpec } from '../value-objects/run-spec';
import { RawRunOutput } from '../value-objects/raw-run-output';

export abstract class ISandboxRunner {
  abstract run(spec: RunSpec): Promise<RawRunOutput>;
}
