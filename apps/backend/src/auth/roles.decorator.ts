import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'auth_roles';
export type AppRole = 'Administrators' | 'CivilServants' | 'Customers';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
