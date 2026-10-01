import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../../../entities/user.entity'; 
import { TeacherDivisionLevel } from '../../../entities/division.entity'; // This will work after merge

@Injectable()
export class FinanceDeptGuard implements CanActivate {
  private readonly requiredDivisionId = 1;
  private readonly minLevel = TeacherDivisionLevel.MEMBER;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user } = context.switchToHttp().getRequest();

    if (!user || user.role !== UserRole.TEACHER || !user.divisionLevels) {
      throw new ForbiddenException('Access Denied: Teacher role and division info required.');
    }

    const userMemberships: { divisionId: number, level: TeacherDivisionLevel }[] = user.divisionLevels;

    const hasPermission = userMemberships.some(
      membership =>
        membership.divisionId === this.requiredDivisionId &&
        membership.level >= this.minLevel,
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Access Denied: Minimum level ${this.minLevel} in division ${this.requiredDivisionId} required.`);
    }

    return true; // 접근 허용
  }
}