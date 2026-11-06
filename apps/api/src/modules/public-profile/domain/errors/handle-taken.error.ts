export class HandleTakenError extends Error {
  constructor(handle: string) {
    super(`Handle ${handle} is already taken.`);
    this.name = 'HandleTakenError';
  }
}
