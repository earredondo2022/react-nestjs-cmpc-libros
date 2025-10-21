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
export declare class UserService {
    private userModel;
    private transactionService;
    private auditService;
    private readonly SALT_ROUNDS;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly LOCKOUT_TIME;
    constructor(userModel: typeof User, transactionService: TransactionService, auditService: AuditService);
    createUser(userData: CreateUserDto, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<User>;
    updateUser(userId: string, updateData: UpdateUserDto, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<User>;
    changePassword(userId: string, passwordData: ChangePasswordDto, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    handleFailedLogin(email: string, ipAddress?: string): Promise<void>;
    handleSuccessfulLogin(userId: string, ipAddress?: string): Promise<void>;
    isAccountLocked(email: string): Promise<boolean>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    deactivateUser(userId: string, auditContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
}
