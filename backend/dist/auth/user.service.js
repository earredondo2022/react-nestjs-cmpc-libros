"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("./entities/user.entity");
const transaction_service_1 = require("../common/services/transaction.service");
const audit_service_1 = require("../audit/audit.service");
let UserService = class UserService {
    constructor(userModel, transactionService, auditService) {
        this.userModel = userModel;
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.SALT_ROUNDS = 12;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_TIME = 30 * 60 * 1000;
    }
    async createUser(userData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const existingUser = await this.userModel.findOne({
                where: { email: userData.email },
                transaction,
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
            const newUser = await this.userModel.create({
                ...userData,
                password: hashedPassword,
                passwordChangedAt: new Date(),
            }, { transaction });
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
    async updateUser(userId, updateData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const oldUser = await this.userModel.findByPk(userId, { transaction });
            if (!oldUser) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.userModel.update(updateData, {
                where: { id: userId },
                transaction,
            });
            const updatedUser = await this.userModel.findByPk(userId, { transaction });
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
    async changePassword(userId, passwordData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const user = await this.userModel.findByPk(userId, { transaction });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, this.SALT_ROUNDS);
            await this.userModel.update({
                password: hashedNewPassword,
                passwordChangedAt: new Date(),
                loginAttempts: 0,
                lockedUntil: null,
            }, {
                where: { id: userId },
                transaction,
            });
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
    async handleFailedLogin(email, ipAddress) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const user = await this.userModel.findOne({
                where: { email },
                transaction,
            });
            if (!user) {
                return;
            }
            const loginAttempts = user.loginAttempts + 1;
            const updateData = { loginAttempts };
            if (loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_TIME);
            }
            await this.userModel.update(updateData, {
                where: { id: user.id },
                transaction,
            });
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
    async handleSuccessfulLogin(userId, ipAddress) {
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
    async isAccountLocked(email) {
        const user = await this.userModel.findOne({
            where: { email },
            attributes: ['lockedUntil'],
        });
        if (!user || !user.lockedUntil) {
            return false;
        }
        return user.lockedUntil > new Date();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ where: { email } });
    }
    async findById(id) {
        return this.userModel.findByPk(id);
    }
    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
    async deactivateUser(userId, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const user = await this.userModel.findByPk(userId, { transaction });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.userModel.update({ isActive: false }, {
                where: { id: userId },
                transaction,
            });
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
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __metadata("design:paramtypes", [Object, transaction_service_1.TransactionService,
        audit_service_1.AuditService])
], UserService);
//# sourceMappingURL=user.service.js.map