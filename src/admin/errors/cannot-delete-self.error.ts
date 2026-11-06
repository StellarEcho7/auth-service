export class CannotDeleteSelfError extends Error {
  constructor() {
    super('Administrators cannot delete their own account');
    this.name = 'CannotDeleteSelfError';
  }
}
