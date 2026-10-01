import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../entities/user.entity';
import { TeacherDivisionLevel } from '../../../entities/division.entity';

export type RequiredPermission = 
  | UserRole //
  | { divisionId: number; level: TeacherDivisionLevel };

export const ROLES_KEY = 'roles';
export const Roles = (...permissions: RequiredPermission[]) => SetMetadata(ROLES_KEY, permissions);