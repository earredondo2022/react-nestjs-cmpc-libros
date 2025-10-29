import { JwtService } from '@nestjs/jwt';
import { UserService, CreateUserDto, ChangePasswordDto } from './user.service';
import { TransactionService } from '../common/services/transaction.service';
import { AuditService } from '../audit/audit.service';
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
export declare class AuthService {
    private jwtService;
    private userService;
    private transactionService;
    private auditService;
    constructor(jwtService: JwtService, userService: UserService, transactionService: TransactionService, auditService: AuditService);
    login(loginData: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse>;
    register(userData: CreateUserDto, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<LoginResponse>;
    changePassword(userId: string, passwordData: ChangePasswordDto, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    validateUser(email: string, password: string): Promise<AuthUser | null>;
    legacyLogin(user: AuthUser): Promise<LoginResponse>;
    validateJwtPayload(payload: any): Promise<AuthUser | null>;
    logout(userId: string, auditContext?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
}
