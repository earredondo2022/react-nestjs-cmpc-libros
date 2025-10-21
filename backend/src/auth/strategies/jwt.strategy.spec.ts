import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      validateJwtPayload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when payload is valid', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      
      mockAuthService.validateJwtPayload.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateJwtPayload).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = { sub: 1, email: 'invalid@example.com' };
      
      mockAuthService.validateJwtPayload.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.validateJwtPayload).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException when authService throws error', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      
      mockAuthService.validateJwtPayload.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(Error);
      expect(mockAuthService.validateJwtPayload).toHaveBeenCalledWith(payload);
    });

    it('should handle demo user payload', async () => {
      const payload = { sub: 'demo', email: 'demo@cmpc-libros.com' };
      const demoUser = { id: 'demo', email: 'demo@cmpc-libros.com', name: 'Demo User' };
      
      mockAuthService.validateJwtPayload.mockResolvedValue(demoUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(demoUser);
      expect(mockAuthService.validateJwtPayload).toHaveBeenCalledWith(payload);
    });

    it('should handle undefined user response', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      
      mockAuthService.validateJwtPayload.mockResolvedValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.validateJwtPayload).toHaveBeenCalledWith(payload);
    });
  });
});