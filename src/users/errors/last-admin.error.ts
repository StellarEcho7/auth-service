export class LastAdminError extends Error {
  constructor() {
    super('Cannot remove or demote the last administrator');
    this.name = 'LastAdminError';
  }
}
