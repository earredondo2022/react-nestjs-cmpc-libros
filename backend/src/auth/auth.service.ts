import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService, CreateUserDto, ChangePasswordDto } from './user.service';
import { User } from './entities/user.entity';
import { TransactionService } from '../common/services/transaction.service';
import { AuditService } from '../audit/audit.service';

// Simple user interface for authentication (keeping for backward compatibility)
export interface AuthUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private transactionService: TransactionService,
    private auditService: AuditService,
  ) {}

  /**
   * Enhanced login with transaction support and audit logging
   */
  async login(
    loginData: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const { email, password } = loginData;

    return await this.transactionService.runInTransaction(async (transaction) => {
      // Check if account is locked
      const isLocked = await this.userService.isAccountLocked(email);
      if (isLocked) {
        throw new BadRequestException('Account is temporarily locked due to multiple failed login attempts');
      }

      // Try to find user in database first
      let user = await this.userService.findByEmail(email);
      let validatedUser: AuthUser | null = null;

      if (user) {
        // Database user validation
        if (!user.isActive) {
          throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await this.userService.verifyPassword(password, user.password);
        if (isPasswordValid) {
          validatedUser = {
            id: user.id,
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          };

          // Handle successful login
          await this.userService.handleSuccessfulLogin(user.id, ipAddress);
        }
      }

      if (!validatedUser) {
        // Handle failed login attempt
        await this.userService.handleFailedLogin(email, ipAddress);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = { 
        email: validatedUser.email, 
        sub: validatedUser.id, 
        role: validatedUser.role,
        firstName: validatedUser.firstName,
        lastName: validatedUser.lastName
      };

      const accessToken = this.jwtService.sign(payload);

      // Log successful authentication
      await this.auditService.logCreateWithTransaction({
        userId: validatedUser.id,
        tableName: 'auth_sessions',
        recordId: validatedUser.id,
        newValues: { 
          userId: validatedUser.id,
          email: validatedUser.email,
          tokenGenerated: true,
        },
        ipAddress,
        userAgent,
        description: `Token JWT generado para usuario: ${validatedUser.email}`,
      }, transaction);

      return {
        access_token: accessToken,
        user: {
          id: validatedUser.id,
          email: validatedUser.email,
          firstName: validatedUser.firstName,
          lastName: validatedUser.lastName,
          role: validatedUser.role,
        },
      };
    });
  }

  /**
   * Register new user with transaction support
   */
  async register(
    userData: CreateUserDto,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponse> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Create user using UserService
      const newUser = await this.userService.createUser(userData, auditContext);

      // Auto-login after registration
      const loginData: LoginDto = {
        email: userData.email,
        password: userData.password,
      };

      // Generate JWT for new user
      const payload = { 
        email: newUser.email, 
        sub: newUser.id, 
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      };

      const accessToken = this.jwtService.sign(payload);

      // Log registration and auto-login
      await this.auditService.logCreateWithTransaction({
        userId: newUser.id,
        tableName: 'auth_sessions',
        recordId: newUser.id,
        newValues: { 
          userId: newUser.id,
          email: newUser.email,
          action: 'registration_auto_login',
        },
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        description: `Auto-login después del registro para usuario: ${newUser.email}`,
      }, transaction);

      return {
        access_token: accessToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      };
    });
  }

  /**
   * Change password with transaction support
   */
  async changePassword(
    userId: string,
    passwordData: ChangePasswordDto,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    return this.userService.changePassword(userId, passwordData, auditContext);
  }

  /**
   * Legacy method for backward compatibility
   */
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    // Try database user first
    const user = await this.userService.findByEmail(email);
    if (user && user.isActive) {
      const isPasswordValid = await this.userService.verifyPassword(password, user.password);
      if (isPasswordValid) {
        return {
          id: user.id,
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      }
    }
    
    return null;
  }

  /**
   * Legacy login method for backward compatibility
   */
  async legacyLogin(user: AuthUser): Promise<LoginResponse> {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: any): Promise<AuthUser | null> {
    // Try database user first
    const user = await this.userService.findById(payload.sub);
    if (user && user.isActive) {
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    }
    
    return null;
  }

  /**
   * Logout with audit logging
   */
  async logout(
    userId: string,
    auditContext?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.auditService.logCreate({
      userId,
      tableName: 'auth_sessions',
      recordId: userId,
      newValues: { 
        action: 'logout',
        timestamp: new Date(),
      },
      ipAddress: auditContext?.ipAddress,
      userAgent: auditContext?.userAgent,
      description: `Usuario cerró sesión`,
    });
  }
}