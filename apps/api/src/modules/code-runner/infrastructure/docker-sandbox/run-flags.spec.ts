import { buildDockerRunArgs, SANDBOX_RUN_USER } from './run-flags';

const base = {
  image: 'node:20-alpine',
  workDir: '/tmp/x',
  memoryMb: 128,
  name: 'elevate-test',
  readOnly: true,
  command: ['node', '/sandbox/main.js'],
};

describe('buildDockerRunArgs', () => {
  it('isolates the container from the network and drops privileges', () => {
    const args = buildDockerRunArgs(base);

    expect(args).toEqual(expect.arrayContaining(['--network', 'none', '--cap-drop', 'ALL']));
    expect(args).toContain('--read-only');
  });

  it('runs user code as an unprivileged user when requested', () => {
    const args = buildDockerRunArgs({ ...base, user: SANDBOX_RUN_USER });

    const index = args.indexOf('--user');
    expect(args[index + 1]).toBe('65534:65534');
    expect(index).toBeLessThan(args.indexOf(base.image));
  });
});
