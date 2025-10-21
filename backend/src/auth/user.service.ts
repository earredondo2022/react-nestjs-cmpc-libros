import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { TransactionService } from '../common/services/transaction.service';
import { AuditService } from '../audit/audit.service';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private transactionService: TransactionService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new user with transaction support
   */
  async createUser(
    userData: CreateUserDto,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<User> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        where: { email: userData.email },
        transaction,
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      // Create user
      const newUser = await this.userModel.create({
        ...userData,
        password: hashedPassword,
        passwordChangedAt: new Date(),
      }, { transaction });

      // Log audit
      if (auditContext) {
        await this.auditService.logCreateWithTransaction({
          userId: auditContext.userId,
          tableName: 'users',
          recordId: newUser.id,
          newValues: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            isActive: newUser.isActive,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Usuario creado: ${newUser.email}`,
        }, transaction);
      }

      return newUser;
    });
  }

  /**
   * Update user information with transaction support
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserDto,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<User> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Get current user data for audit
      const oldUser = await this.userModel.findByPk(userId, { transaction });
      if (!oldUser) {
        throw new NotFoundException('User not found');
      }

      // Update user
      await this.userModel.update(updateData, {
        where: { id: userId },
        transaction,
      });

      // Get updated user
      const updatedUser = await this.userModel.findByPk(userId, { transaction });

      // Log audit
      if (auditContext) {
        const oldValues = {
          firstName: oldUser.firstName,
          lastName: oldUser.lastName,
          role: oldUser.role,
          isActive: oldUser.isActive,
        };

        const newValues = {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        };

        await this.auditService.logUpdateWithTransaction({
          userId: auditContext.userId,
          tableName: 'users',
          recordId: userId,
          oldValues,
          newValues,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Usuario actualizado: ${updatedUser.email}`,
        }, transaction);
      }

      return updatedUser;
    });
  }

  /**
   * Change user password with transaction support
   */
  async changePassword(
    userId: string,
    passwordData: ChangePasswordDto,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      // Get current user
      const user = await this.userModel.findByPk(userId, { transaction });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, this.SALT_ROUNDS);

      // Update password
      await this.userModel.update({
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
        loginAttempts: 0, // Reset login attempts
        lockedUntil: null, // Remove any lockout
      }, {
        where: { id: userId },
        transaction,
      });

      // Log audit
      if (auditContext) {
        await this.auditService.logUpdateWithTransaction({
          userId: auditContext.userId,
          tableName: 'users',
          recordId: userId,
          oldValues: { action: 'password_change_requested' },
          newValues: { 
            action: 'password_changed', 
            passwordChangedAt: new Date(),
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Contraseña cambiada para usuario: ${user.email}`,
        }, transaction);
      }
    });
  }

  /**
   * Handle failed login attempt with transaction support
   */
  async handleFailedLogin(
    email: string,
    ipAddress?: string
  ): Promise<void> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      const user = await this.userModel.findOne({
        where: { email },
        transaction,
      });

      if (!user) {
        return; // Don't reveal if user exists
      }

      const loginAttempts = user.loginAttempts + 1;
      const updateData: any = { loginAttempts };

      // Lock account if max attempts reached
      if (loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_TIME);
      }

      await this.userModel.update(updateData, {
        where: { id: user.id },
        transaction,
      });

      // Log audit
      await this.auditService.logUpdateWithTransaction({
        tableName: 'users',
        recordId: user.id,
        oldValues: { loginAttempts: user.loginAttempts },
        newValues: { loginAttempts, lockedUntil: updateData.lockedUntil },
        ipAddress,
        description: `Intento de login fallido para: ${email}. Intentos: ${loginAttempts}`,
      }, transaction);
    });
  }

  /**
   * Handle successful login with transaction support
   */
  async handleSuccessfulLogin(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      const user = await this.userModel.findByPk(userId, { transaction });
      if (!user) {
        return;
      }

      await this.userModel.update({
        lastLogin: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
        lockedUntil: null,
      }, {
        where: { id: userId },
        transaction,
      });

      // Log audit
      await this.auditService.logUpdateWithTransaction({
        tableName: 'users',
        recordId: userId,
        oldValues: { action: 'login_attempted' },
        newValues: { 
          action: 'login_successful',
          lastLogin: new Date(),
          lastLoginIp: ipAddress,
        },
        ipAddress,
        description: `Login exitoso para usuario: ${user.email}`,
      }, transaction);
    });
  }

  /**
   * Check if user account is locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({
      where: { email },
      attributes: ['lockedUntil'],
    });

    if (!user || !user.lockedUntil) {
      return false;
    }

    return user.lockedUntil > new Date();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Deactivate user account with transaction support
   */
  async deactivateUser(
    userId: string,
    auditContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    return await this.transactionService.runInTransaction(async (transaction) => {
      const user = await this.userModel.findByPk(userId, { transaction });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userModel.update({ isActive: false }, {
        where: { id: userId },
        transaction,
      });

      // Log audit
      if (auditContext) {
        await this.auditService.logUpdateWithTransaction({
          userId: auditContext.userId,
          tableName: 'users',
          recordId: userId,
          oldValues: { isActive: true },
          newValues: { isActive: false },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          description: `Usuario desactivado: ${user.email}`,
        }, transaction);
      }
    });
  }
}