import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { TransactionService } from '../common/services/transaction.service';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;
  let transactionService: TransactionService;
  let auditService: AuditService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    verifyPassword: jest.fn(),
    changePassword: jest.fn(),
    isAccountLocked: jest.fn(),
    handleSuccessfulLogin: jest.fn(),
    handleFailedLogin: jest.fn(),
  };

  const mockTransactionService = {
    runInTransaction: jest.fn().mockImplementation((callback) => callback()),
  };

  const mockAuditService = {
    logCreate: jest.fn(),
    logCreateWithTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    transactionService = module.get<TransactionService>(TransactionService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });
    });

    it('should return null when user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user is not active', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserService.findByEmail.mockResolvedValue(inactiveUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return demo user for demo credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('admin@cmpc-libros.com', 'admin123');

      expect(result).toEqual({
        id: '1',
        email: 'admin@cmpc-libros.com',
        password: expect.any(String),
        firstName: 'Admin',
        lastName: 'CMPC',
        role: 'admin',
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token when credentials are valid', async () => {
      mockUserService.isAccountLocked.mockResolvedValue(false);
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);
      mockUserService.handleSuccessfulLogin.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.logCreateWithTransaction.mockResolvedValue({});

      const result = await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(mockUserService.isAccountLocked).toHaveBeenCalledWith(loginDto.email);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockUserService.handleSuccessfulLogin).toHaveBeenCalledWith(mockUser.id, '127.0.0.1');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
      });
    });

    it('should throw BadRequestException when account is locked', async () => {
      mockUserService.isAccountLocked.mockResolvedValue(true);

      await expect(service.login(loginDto, '127.0.0.1', 'test-agent')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserService.isAccountLocked.mockResolvedValue(false);
      mockUserService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto, '127.0.0.1', 'test-agent')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserService.isAccountLocked.mockResolvedValue(false);
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);
      mockUserService.handleFailedLogin.mockResolvedValue({});

      await expect(service.login(loginDto, '127.0.0.1', 'test-agent')).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.handleFailedLogin).toHaveBeenCalledWith(loginDto.email, '127.0.0.1');
    });

    it('should handle demo user login when no database user exists', async () => {
      const demoLoginDto = {
        email: 'admin@cmpc-libros.com',
        password: 'admin123',
      };

      mockUserService.isAccountLocked.mockResolvedValue(false);
      mockUserService.findByEmail.mockResolvedValue(null);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.logCreateWithTransaction.mockResolvedValue({});

      const result = await service.login(demoLoginDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: '1',
          email: 'admin@cmpc-libros.com',
          firstName: 'Admin',
          lastName: 'CMPC',
          role: 'admin',
        },
      });
    });
  });

  describe('legacyLogin', () => {
    it('should return access token for legacy login', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.legacyLogin(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: 'user',
    };

    const auditContext = {
      userId: 'admin-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should create a new user and return auto-login response', async () => {
      const newUser = {
        id: 'new-user-id',
        email: registerDto.email,
        password: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
        isActive: true,
      };

      mockUserService.createUser.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.logCreateWithTransaction.mockResolvedValue({});

      const result = await service.register(registerDto, auditContext);

      expect(mockUserService.createUser).toHaveBeenCalledWith(registerDto, auditContext);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: newUser.email,
        sub: newUser.id,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      });
      expect(mockAuditService.logCreateWithTransaction).toHaveBeenCalledWith({
        userId: newUser.id,
        tableName: 'auth_sessions',
        recordId: newUser.id,
        newValues: {
          userId: newUser.id,
          email: newUser.email,
          action: 'registration_auto_login',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        description: `Auto-login después del registro para usuario: ${newUser.email}`,
      }, undefined);
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      });
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
    };

    const auditContext = {
      userId: 'user-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should change password successfully', async () => {
      mockUserService.changePassword.mockResolvedValue(undefined);

      await service.changePassword('user-id', passwordData, auditContext);

      expect(mockUserService.changePassword).toHaveBeenCalledWith('user-id', passwordData, auditContext);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when payload is valid and user exists in database', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload(payload);

      expect(mockUserService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        password: mockUser.password,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
    });

    it('should return demo user for demo user payload', async () => {
      const payload = { sub: '1', email: 'admin@cmpc-libros.com' };
      mockUserService.findById.mockResolvedValue(null);

      const result = await service.validateJwtPayload(payload);

      expect(result).toEqual({
        id: '1',
        email: 'admin@cmpc-libros.com',
        password: expect.any(String),
        firstName: 'Admin',
        lastName: 'CMPC',
        role: 'admin',
      });
    });

    it('should return null when user not found and not demo user', async () => {
      const payload = { sub: 'nonexistent-id', email: 'test@example.com' };
      mockUserService.findById.mockResolvedValue(null);

      const result = await service.validateJwtPayload(payload);

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should log logout action', async () => {
      const auditContext = {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockAuditService.logCreate.mockResolvedValue({});

      await service.logout('user-id', auditContext);

      expect(mockAuditService.logCreate).toHaveBeenCalledWith({
        userId: 'user-id',
        tableName: 'auth_sessions',
        recordId: 'user-id',
        newValues: {
          action: 'logout',
          timestamp: expect.any(Date),
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        description: 'Usuario cerró sesión',
      });
    });
  });
});