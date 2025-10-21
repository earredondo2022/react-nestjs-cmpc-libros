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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const user_service_1 = require("./user.service");
const transaction_service_1 = require("../common/services/transaction.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(jwtService, userService, transactionService, auditService) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.demoUser = {
            id: '1',
            email: 'admin@cmpc-libros.com',
            password: '$2a$10$mBjC92mlR1YPL3Ua1Uewvuju6xKE51LfSrWskEYfbkoshe6cPgdT6',
            firstName: 'Admin',
            lastName: 'CMPC',
            role: 'admin'
        };
    }
    async login(loginData, ipAddress, userAgent) {
        const { email, password } = loginData;
        return await this.transactionService.runInTransaction(async (transaction) => {
            const isLocked = await this.userService.isAccountLocked(email);
            if (isLocked) {
                throw new common_1.BadRequestException('Account is temporarily locked due to multiple failed login attempts');
            }
            let user = await this.userService.findByEmail(email);
            let validatedUser = null;
            if (user) {
                if (!user.isActive) {
                    throw new common_1.UnauthorizedException('Account is deactivated');
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
                    await this.userService.handleSuccessfulLogin(user.id, ipAddress);
                }
            }
            else {
                if (email === this.demoUser.email && await bcrypt.compare(password, this.demoUser.password)) {
                    validatedUser = this.demoUser;
                    await this.auditService.logCreateWithTransaction({
                        tableName: 'auth_sessions',
                        recordId: this.demoUser.id,
                        newValues: {
                            userId: this.demoUser.id,
                            email: this.demoUser.email,
                            loginType: 'demo_user',
                        },
                        ipAddress,
                        userAgent,
                        description: `Login exitoso para usuario demo: ${this.demoUser.email}`,
                    }, transaction);
                }
            }
            if (!validatedUser) {
                await this.userService.handleFailedLogin(email, ipAddress);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const payload = {
                email: validatedUser.email,
                sub: validatedUser.id,
                role: validatedUser.role,
                firstName: validatedUser.firstName,
                lastName: validatedUser.lastName
            };
            const accessToken = this.jwtService.sign(payload);
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
    async register(userData, auditContext) {
        return await this.transactionService.runInTransaction(async (transaction) => {
            const newUser = await this.userService.createUser(userData, auditContext);
            const loginData = {
                email: userData.email,
                password: userData.password,
            };
            const payload = {
                email: newUser.email,
                sub: newUser.id,
                role: newUser.role,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            };
            const accessToken = this.jwtService.sign(payload);
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
    async changePassword(userId, passwordData, auditContext) {
        return this.userService.changePassword(userId, passwordData, auditContext);
    }
    async validateUser(email, password) {
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
        if (email === this.demoUser.email && await bcrypt.compare(password, this.demoUser.password)) {
            return this.demoUser;
        }
        return null;
    }
    async legacyLogin(user) {
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
    async validateJwtPayload(payload) {
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
        if (payload.sub === this.demoUser.id) {
            return this.demoUser;
        }
        return null;
    }
    async logout(userId, auditContext) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        user_service_1.UserService,
        transaction_service_1.TransactionService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map