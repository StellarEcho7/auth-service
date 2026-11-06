import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { RoleName } from '../../users/dto/role.dto';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(RoleName, { each: true })
  roles: RoleName[];
}
