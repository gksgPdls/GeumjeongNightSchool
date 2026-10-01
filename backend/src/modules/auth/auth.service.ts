// src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity, UserRole } from '../../entities/user.entity';
import { TeacherEntity } from '../../entities/person.entity';
import { TeacherDivisionLevel } from '../../entities/division.entity';

@Injectable()
export class AuthService {
  // Replacemnet of inmemory token management is needed(Redis)
  private tokenBlacklist: Set<string> = new Set();
  
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async validateUser(username: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOne({ 
      where: { username },
      relations: [
        'teacher',
        'teacher.division_memberships', 
        'teacher.division_memberships.division',
        'teacher.class_schedules',
        'teacher.class_schedules.class',
        'student', 
      ]
    });
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      const { password, ...result } = user;
      return result as UserEntity;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    
    const user = await this.validateUser(username, password);
    
    if (!user) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');
    }
    
    const divisionLevels = user.teacher?.division_memberships?.map(m => ({
      divisionId: m.division_id,
      divisionName: m.division?.name || 'Unknown Division',
      level: m.level
    })).filter(d => d.divisionName !== 'Unknown Division') || [];

    const payload = { 
      sub: user.id,
      username: user.username,
      role: user.role,
      teacher_id: user.teacher_id,
      student_id: user.student_id,
      divisionLevels: divisionLevels 
    };
    
    const token = this.jwtService.sign(payload);
    
    let userInfo;
    if (user.role === UserRole.TEACHER && user.teacher) {
        const mainMembership = user.teacher.division_memberships?.find(m => m.is_primary);

        userInfo = {
            id: user.id,
            username: user.username,
            name: user.teacher.name, // 교사 실명
            role: user.role,
            main_division: mainMembership && mainMembership.division ? {
                id: mainMembership.division.id,
                name: mainMembership.division.name,
                level: mainMembership.level as TeacherDivisionLevel
            } : null,
            classes: user.teacher.class_schedules?.map(sc => sc.class ? ({
                id: sc.class.id,
                name: sc.class.name,
                type: sc.class.class_type
            }) : null).filter(c => c !== null) || []
        };
    } else if (user.role === UserRole.STUDENT && user.student) {
        // 학생 정보 구성 (필요시 확장)
        userInfo = {
            id: user.id,
            username: user.username,
            name: user.student.name, // 학생 실명
            role: user.role,
        };
    } else {
        userInfo = {
            id: user.id,
            username: user.username,
            name: user.username, // 기본값
            role: user.role,
        };
    }
    
    return {
      access_token: token,
      userInfo: userInfo
    };
  }

  validateToken(token: string): boolean {
    if (this.tokenBlacklist.has(token)) {
      return false;
    }
    try {
      this.jwtService.verify(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  invalidateToken(token: string): void {
    this.tokenBlacklist.add(token);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { username, password, email, role, teacher_id, student_id } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
      email,
      role,
      teacher_id,
      student_id,
    });
    
    return this.usersRepository.save(user);
  }
}