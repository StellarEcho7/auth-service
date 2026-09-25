export class DuplicateEmailError extends Error {
  constructor(public readonly email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'DuplicateEmailError';
  }
}
