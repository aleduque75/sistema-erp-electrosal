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

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    // --- INÍCIO DO DEBUG ---
    console.log('--- DADOS RECEBIDOS NO LOGIN ---');
    console.log(`Email bruto: '${loginUserDto.email}'`);
    console.log(`Senha bruta: '${loginUserDto.password}'`);
    // --------------------

    const cleanEmail = loginUserDto.email.toLowerCase().trim();

    // --- DEBUG da busca no banco ---
    console.log(`Buscando no banco de dados pelo email: '${cleanEmail}'`);
    // -----------------------------

    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      console.log('--- Usuário NÃO encontrado no banco. ---');
      throw new UnauthorizedException('Credenciais inválidas');
    }
    console.log('--- Usuário ENCONTRADO no banco. ---');

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password.trim(),
      user.password,
    );
    if (!isPasswordValid) {
      console.log('--- Senha INVÁLIDA. ---');
      throw new UnauthorizedException('Credenciais inválidas');
    }
    console.log('--- Senha VÁLIDA. ---');

    const payload = { email: user.email, sub: user.id };
    return { accessToken: this.jwtService.sign(payload) };
  }
}