import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoleName } from '../../users/dto/role.dto';
import { UpdateUserRolesDto } from './update-user-roles.dto';

const validateRoles = (roles: unknown) =>
  validate(plainToInstance(UpdateUserRolesDto, { roles }));

describe('UpdateUserRolesDto', () => {
  it('accepts a non-empty list of known roles', async () => {
    await expect(validateRoles([RoleName.ADMIN])).resolves.toHaveLength(0);
  });

  it('rejects a missing list', async () => {
    await expect(validateRoles(undefined)).resolves.not.toHaveLength(0);
  });

  it('rejects an empty list', async () => {
    await expect(validateRoles([])).resolves.not.toHaveLength(0);
  });

  it('rejects unknown roles', async () => {
    await expect(validateRoles(['SUPERADMIN'])).resolves.not.toHaveLength(0);
  });

  it('rejects duplicate roles', async () => {
    await expect(
      validateRoles([RoleName.USER, RoleName.USER]),
    ).resolves.not.toHaveLength(0);
  });
});
