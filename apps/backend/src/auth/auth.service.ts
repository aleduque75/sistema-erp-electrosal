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
  ): Promise<{ accessToken: string }> {
    // A lógica de registro precisará ser ajustada para criar uma organização também,
    // mas por enquanto, vamos focar no login.
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
      // organizationId: '...', // Precisaria do ID da organização
    });

    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(user: any): Promise<{ accessToken: string }> {
    // O 'user' aqui já vem validado pela LocalStrategy

    // 👇 A CORREÇÃO PRINCIPAL ESTÁ AQUI 👇
    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId, // Adiciona o ID da organização ao token
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}
