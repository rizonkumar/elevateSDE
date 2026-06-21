export interface DockerRunOptions {
  image: string;
  workDir: string;
  memoryMb: number;
  name: string;
  readOnly: boolean;
  command: string[];
  pidsLimit?: number;
}

export function buildDockerRunArgs(options: DockerRunOptions): string[] {
  const mountMode = options.readOnly ? 'ro' : 'rw';
  const args = [
    'run',
    '--rm',
    '--name',
    options.name,
    '--network',
    'none',
    `--memory=${options.memoryMb}m`,
    `--memory-swap=${options.memoryMb}m`,
    '--cpus=1.0',
    `--pids-limit=${options.pidsLimit ?? 64}`,
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
  ];
  if (options.readOnly) {
    args.push('--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m');
  }
  args.push(
    '-v',
    `${options.workDir}:/sandbox:${mountMode}`,
    '--workdir',
    '/sandbox',
    options.image,
    ...options.command,
  );
  return args;
}
