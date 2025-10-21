import { Model } from 'sequelize-typescript';
export declare class User extends Model {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLogin: Date;
    lastLoginIp: string;
    loginAttempts: number;
    lockedUntil: Date;
    passwordChangedAt: Date;
}
