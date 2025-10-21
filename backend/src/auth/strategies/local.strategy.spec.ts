import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle demo user validation', async () => {
      const email = 'demo@cmpc-libros.com';
      const password = 'demo123';
      const demoUser = { id: 'demo', email: 'demo@cmpc-libros.com', name: 'Demo User' };
      
      mockAuthService.validateUser.mockResolvedValue(demoUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(demoUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle empty email', async () => {
      const email = '';
      const password = 'password123';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle empty password', async () => {
      const email = 'test@example.com';
      const password = '';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle authService throwing error', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockRejectedValue(new Error('Database connection error'));

      await expect(strategy.validate(email, password)).rejects.toThrow(Error);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle undefined user response', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });
  });
});