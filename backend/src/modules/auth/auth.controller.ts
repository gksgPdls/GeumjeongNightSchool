import { Body, Controller, Post, HttpCode, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '사용자 로그인' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: '로그인 성공',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT 토큰' },
        userInfo: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '사용자 ID' },
            username: { type: 'string', description: '사용자명' },
            name: { type: 'string', description: '실명' },
            role: { type: 'string', description: '사용자 역할' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: '새 사용자 계정 생성' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: '계정 생성 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '생성된 사용자 ID' },
        username: { type: 'string', description: '사용자명' },
        role: { type: 'string', description: '사용자 역할' },
        created_at: { type: 'string', format: 'date-time', description: '생성일시' }
      }
    }
  })
  @ApiResponse({ status: 409, description: '이미 존재하는 사용자명' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '사용자 로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      this.authService.invalidateToken(token);
    }
    return { message: 'Log out.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '토큰 유효성 검증' })
  @ApiResponse({ 
    status: 200, 
    description: '유효한 토큰',
    schema: {
      type: 'object',
      properties: {
        authenticated: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  verifyToken() {
    return { authenticated: true };
  }
}