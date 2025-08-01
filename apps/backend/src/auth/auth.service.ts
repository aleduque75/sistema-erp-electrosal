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
      role: 'USER', // Define a função padrão como USER
    });

    const payload = { email: user.email, sub: user.id };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(user: any): Promise<{ accessToken: string }> { // Recebe o usuário já validado
    const payload = { email: user.email, sub: user.id };
    return { accessToken: this.jwtService.sign(payload) };
  }
}