import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };

  const mockAuthService = {
    legacyLogin: jest.fn(),
  };

  const mockRequest = {
    user: mockUser,
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
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
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

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const expectedResult = { 
        access_token: 'jwt-token',
        user: mockUser,
        expiresIn: 3600
      };

      mockAuthService.legacyLogin.mockResolvedValue(expectedResult);

      const result = await controller.login(mockRequest as any);

      expect(mockAuthService.legacyLogin).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should handle login with different user data', async () => {
      const differentUser = {
        id: 'different-user-id',
        email: 'different@example.com',
        firstName: 'Different',
        lastName: 'User',
        isActive: true,
      };

      const requestWithDifferentUser = {
        user: differentUser,
      };

      const expectedResult = { 
        access_token: 'different-jwt-token',
        user: differentUser,
        expiresIn: 3600
      };

      mockAuthService.legacyLogin.mockResolvedValue(expectedResult);

      const result = await controller.login(requestWithDifferentUser as any);

      expect(mockAuthService.legacyLogin).toHaveBeenCalledWith(differentUser);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service error', async () => {
      mockAuthService.legacyLogin.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.login(mockRequest as any)
      ).rejects.toThrow('Service error');

      expect(mockAuthService.legacyLogin).toHaveBeenCalledWith(mockUser);
    });

    it('should handle empty user', async () => {
      const emptyRequest = { user: null };
      
      mockAuthService.legacyLogin.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(emptyRequest as any);

      expect(mockAuthService.legacyLogin).toHaveBeenCalledWith(null);
      expect(result).toEqual({ access_token: 'token' });
    });
  });
});