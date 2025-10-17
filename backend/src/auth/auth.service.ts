import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

// Simple user interface for authentication
export interface AuthUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable()
export class AuthService {
  // Hardcoded user for demo purposes
  private readonly demoUser: AuthUser = {
    id: '1',
    email: 'admin@cmpc-libros.com',
    password: '$2a$10$mBjC92mlR1YPL3Ua1Uewvuju6xKE51LfSrWskEYfbkoshe6cPgdT6', // admin123
    firstName: 'Admin',
    lastName: 'CMPC',
    role: 'admin'
  };

  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    if (email === this.demoUser.email && await bcrypt.compare(password, this.demoUser.password)) {
      return this.demoUser;
    }
    
    return null;
  }

  async login(user: AuthUser) {
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

  async validateJwtPayload(payload: any): Promise<AuthUser | null> {
    if (payload.sub === this.demoUser.id) {
      return this.demoUser;
    }
    return null;
  }
}