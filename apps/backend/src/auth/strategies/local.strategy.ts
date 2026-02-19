import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    console.log(`[Auth] Tentativa de login: ${cleanEmail}`);

    const user = await this.usersService.findByEmail(cleanEmail);

    if (!user) {
      console.log(`[Auth] Usuário não encontrado: ${cleanEmail}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      console.log(`[Auth] Usuário inativo: ${cleanEmail}`);
      throw new UnauthorizedException('Usuário desativado');
    }

    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
    
    if (!isPasswordValid) {
      console.log(`[Auth] Senha incorreta para: ${cleanEmail}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { password: _, ...result } = user;
    return result;
  }
}