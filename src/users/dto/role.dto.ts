export enum RoleName {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class RoleDto {
  id: string;
  name: RoleName;
}
