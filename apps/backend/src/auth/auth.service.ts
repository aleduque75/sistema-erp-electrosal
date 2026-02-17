import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterUserDto, LoginUserDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ access_token: string }> {
    // ✅ Padronizado
    const cleanEmail = registerUserDto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(cleanEmail);
    if (existingUser) {
      throw new BadRequestException('Usuário com este e-mail já existe');
    }

    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);
    const user = await this.usersService.create({
      email: cleanEmail,
      password: hashedPassword,
      name: registerUserDto.name,
    });

    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };

    // ✅ Retornando access_token (com underline)
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(user: any): Promise<{ access_token: string }> {
    // ✅ Padronizado
    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };

    // ✅ Retornando access_token (com underline)
    return { access_token: this.jwtService.sign(payload) };
  }

  async getUserProfile(userId: string, orgId: string) {
    return this.usersService.findByIdAndOrganization(userId, orgId, {
      settings: true,
    });
  }
}
