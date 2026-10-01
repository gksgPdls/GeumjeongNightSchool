import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '사용자명',
    example: 'user123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}