import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserEntity } from '../../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    createUser: jest.fn(),
    login: jest.fn(),
    invalidateToken: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new student user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        role: UserRole.STUDENT,
        student_id: 1,
      };

      const expectedResult: Partial<UserEntity> = {
        id: '1',
        username: 'testuser',
        role: UserRole.STUDENT,
        email: 'test@example.com',
        student_id: 1,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(authService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should register a new teacher user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'teacher1',
        password: 'password123',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
        teacher_id: 1,
      };

      const expectedResult: Partial<UserEntity> = {
        id: '2',
        username: 'teacher1',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
        teacher_id: 1,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(authService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should register an admin user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'admin',
        password: 'password123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const expectedResult: Partial<UserEntity> = {
        id: '3',
        username: 'admin',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
        isActive: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(authService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should login student user and return token with user info', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token-123',
        userInfo: {
          id: '1',
          username: 'testuser',
          name: 'Test Student',
          role: UserRole.STUDENT,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should login teacher user and return token with division and class info', async () => {
      const loginDto: LoginDto = {
        username: 'teacher1',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token-456',
        userInfo: {
          id: '2',
          username: 'teacher1',
          name: 'Teacher Name',
          role: UserRole.TEACHER,
          main_division: {
            id: 1,
            name: 'Math Department',
            level: 'primary',
          },
          classes: [
            {
              id: 1,
              name: 'Algebra 101',
              type: 'regular',
            },
          ],
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should login admin user', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token-789',
        userInfo: {
          id: '3',
          username: 'admin',
          name: 'admin',
          role: UserRole.ADMIN,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should logout user and invalidate token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer test-token-123',
        },
      };

      const result = await controller.logout(mockRequest);

      expect(authService.invalidateToken).toHaveBeenCalledWith('test-token-123');
      expect(result).toEqual({ message: 'Log out.' });
    });

    it('should handle logout without authorization header', async () => {
      const mockRequest = {
        headers: {},
      };

      const result = await controller.logout(mockRequest);

      expect(authService.invalidateToken).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Log out.' });
    });

    it('should handle logout with malformed authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };

      const result = await controller.logout(mockRequest);

      expect(authService.invalidateToken).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Log out.' });
    });

    it('should handle logout with empty authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      };

      const result = await controller.logout(mockRequest);

      expect(authService.invalidateToken).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Log out.' });
    });
  });

  describe('verifyToken', () => {
    it('should return authenticated true for valid token (protected route)', () => {
      const result = controller.verifyToken();

      expect(result).toEqual({ authenticated: true });
    });

    // Note: Token validation is handled by JwtAuthGuard before reaching this method
    // Invalid tokens would be rejected by the guard and not reach the controller method
  });
});
