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
    console.log('--- LocalStrategy.validate called ---'); // NOVO LOG
    console.log(`Email received: '${email}'`); // NOVO LOG
    console.log(`Password received: '${password}'`); // NOVO LOG

    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      console.log('--- User NOT found in LocalStrategy ---'); // NOVO LOG
      throw new UnauthorizedException('Credenciais inválidas');
    }
    console.log('--- User FOUND in LocalStrategy ---'); // NOVO LOG

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      console.log('--- Invalid password in LocalStrategy ---'); // NOVO LOG
      throw new UnauthorizedException('Credenciais inválidas');
    }
    console.log('--- Password valid in LocalStrategy ---'); // NOVO LOG

    const { password: _, ...result } = user;
    return result;
  }
}
