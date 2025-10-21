import { Test, TestingModule } from '@nestjs/testing';
import { UserService, CreateUserDto, UpdateUserDto, ChangePasswordDto } from './user.service';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { TransactionService } from '../common/services/transaction.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userModel: any;
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
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    lastLoginIp: null,
    passwordChangedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  };

  const mockTransactionService = {
    runInTransaction: jest.fn().mockImplementation((callback) => callback()),
  };

  const mockAuditService = {
    logCreateWithTransaction: jest.fn(),
    logUpdateWithTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
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

    service = module.get<UserService>(UserService);
    userModel = module.get(getModelToken(User));
    transactionService = module.get<TransactionService>(TransactionService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
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

    it('should create a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null); // No existing user
      mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockAuditService.logCreateWithTransaction.mockResolvedValue({});

      const result = await service.createUser(createUserDto, auditContext);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
        transaction: undefined,
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword123',
        passwordChangedAt: expect.any(Date),
      }, { transaction: undefined });
      expect(mockAuditService.logCreateWithTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser); // Existing user

      await expect(service.createUser(createUserDto, auditContext))
        .rejects.toThrow(ConflictException);
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should create user without audit context', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockAuditService.logCreateWithTransaction).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'User',
      role: 'admin',
    };

    const auditContext = {
      userId: 'admin-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      
      mockUserModel.findByPk
        .mockResolvedValueOnce(mockUser) // For getting old values
        .mockResolvedValueOnce(updatedUser); // For getting updated values
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      const result = await service.updateUser('user-id', updateUserDto, auditContext);

      expect(mockUserModel.findByPk).toHaveBeenCalledWith('user-id', { transaction: undefined });
      expect(mockUserModel.update).toHaveBeenCalledWith(updateUserDto, {
        where: { id: 'user-id' },
        transaction: undefined,
      });
      expect(mockAuditService.logUpdateWithTransaction).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.updateUser('nonexistent-id', updateUserDto, auditContext))
        .rejects.toThrow(NotFoundException);
    });

    it('should update user without audit context', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      
      mockUserModel.findByPk
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      mockUserModel.update.mockResolvedValue([1]);

      const result = await service.updateUser('user-id', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockAuditService.logUpdateWithTransaction).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
    };

    const auditContext = {
      userId: 'user-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should change password successfully', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue('hashedNewPassword' as never);
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      await service.changePassword('user-id', changePasswordDto, auditContext);

      expect(mockBcrypt.compare).toHaveBeenCalledWith('oldPassword', mockUser.password);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(mockUserModel.update).toHaveBeenCalledWith({
        password: 'hashedNewPassword',
        passwordChangedAt: expect.any(Date),
        loginAttempts: 0,
        lockedUntil: null,
      }, {
        where: { id: 'user-id' },
        transaction: undefined,
      });
      expect(mockAuditService.logUpdateWithTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent-id', changePasswordDto, auditContext))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.changePassword('user-id', changePasswordDto, auditContext))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('handleFailedLogin', () => {
    it('should increment login attempts for existing user', async () => {
      const userWithAttempts = { ...mockUser, loginAttempts: 2 };
      mockUserModel.findOne.mockResolvedValue(userWithAttempts);
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      await service.handleFailedLogin('test@example.com', '127.0.0.1');

      expect(mockUserModel.update).toHaveBeenCalledWith(
        { loginAttempts: 3 },
        { where: { id: userWithAttempts.id }, transaction: undefined }
      );
    });

    it('should lock account after max attempts', async () => {
      const userWithMaxAttempts = { ...mockUser, loginAttempts: 4 };
      mockUserModel.findOne.mockResolvedValue(userWithMaxAttempts);
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      await service.handleFailedLogin('test@example.com', '127.0.0.1');

      expect(mockUserModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          loginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
        { where: { id: userWithMaxAttempts.id }, transaction: undefined }
      );
    });

    it('should not reveal if user does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await service.handleFailedLogin('nonexistent@example.com', '127.0.0.1');

      expect(mockUserModel.update).not.toHaveBeenCalled();
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('should update last login information', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      await service.handleSuccessfulLogin('user-id', '127.0.0.1');

      expect(mockUserModel.update).toHaveBeenCalledWith({
        lastLogin: expect.any(Date),
        lastLoginIp: '127.0.0.1',
        loginAttempts: 0,
        lockedUntil: null,
      }, {
        where: { id: 'user-id' },
        transaction: undefined,
      });
    });

    it('should handle non-existent user gracefully', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await service.handleSuccessfulLogin('nonexistent-id', '127.0.0.1');

      expect(mockUserModel.update).not.toHaveBeenCalled();
    });
  });

  describe('isAccountLocked', () => {
    it('should return true if account is locked', async () => {
      const lockedUser = {
        lockedUntil: new Date(Date.now() + 3600000), // 1 hour from now
      };
      mockUserModel.findOne.mockResolvedValue(lockedUser);

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if account is not locked', async () => {
      const unlockedUser = {
        lockedUntil: null,
      };
      mockUserModel.findOne.mockResolvedValue(unlockedUser);

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(false);
    });

    it('should return false if lock has expired', async () => {
      const expiredLockUser = {
        lockedUntil: new Date(Date.now() - 3600000), // 1 hour ago
      };
      mockUserModel.findOne.mockResolvedValue(expiredLockUser);

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.isAccountLocked('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);

      const result = await service.findById('user-id');

      expect(mockUserModel.findByPk).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.verifyPassword('plainPassword', 'hashedPassword');

      expect(mockBcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.verifyPassword('wrongPassword', 'hashedPassword');

      expect(result).toBe(false);
    });
  });

  describe('deactivateUser', () => {
    const auditContext = {
      userId: 'admin-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should deactivate user successfully', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      mockUserModel.update.mockResolvedValue([1]);
      mockAuditService.logUpdateWithTransaction.mockResolvedValue({});

      await service.deactivateUser('user-id', auditContext);

      expect(mockUserModel.update).toHaveBeenCalledWith(
        { isActive: false },
        { where: { id: 'user-id' }, transaction: undefined }
      );
      expect(mockAuditService.logUpdateWithTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      await expect(service.deactivateUser('nonexistent-id', auditContext))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('error handling', () => {
    it('should handle database errors during user creation', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockUserModel.create.mockRejectedValue(new Error('Database error'));

      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(service.createUser(createUserDto)).rejects.toThrow('Database error');
    });

    it('should handle bcrypt errors', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(service.verifyPassword('password', 'hash')).rejects.toThrow('Bcrypt error');
    });

    it('should handle transaction rollback scenarios', async () => {
      const transactionError = new Error('Transaction failed');
      mockTransactionService.runInTransaction.mockRejectedValue(transactionError);

      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(service.createUser(createUserDto)).rejects.toThrow('Transaction failed');
    });
  });
});