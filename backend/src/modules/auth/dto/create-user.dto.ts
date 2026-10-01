import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자명',
    example: 'newuser123',
    required: true
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '비밀번호 (최소 6자)',
    example: 'password123',
    minLength: 6,
    required: true
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: '이메일 주소',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.STUDENT
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: '교사 ID',
    example: 1
  })
  @IsOptional()
  teacher_id?: number;

  @ApiPropertyOptional({
    description: '학생 ID',
    example: 1
  })
  @IsOptional()
  student_id?: number;
}