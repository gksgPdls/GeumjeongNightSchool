import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../entities/user.entity';
import { TeacherDivisionLevel } from '../../../entities/division.entity';
import { RequiredPermission, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
        throw new ForbiddenException('사용자 정보가 없습니다.');
    }

    const hasPermission = requiredPermissions.some(permission => {
      if (typeof permission === 'string') {
        return user.role === permission;
      }

      // 부서 및 직책 조합 권한 확인
      if (typeof permission === 'object' && user.role === UserRole.TEACHER && user.divisionLevels) {
        const userMemberships: { divisionId: number; level: TeacherDivisionLevel }[] = user.divisionLevels;
        return userMemberships.some(
          membership =>
            membership.divisionId === permission.divisionId &&
            membership.level >= permission.level,
        );
      }
      return false;
    });
    
    if (!hasPermission) {
        throw new ForbiddenException('요청을 처리할 권한이 없습니다.');
    }

    return true;
  }
}