import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PasswordVO } from '../value-objects/password.vo';
import { EmailVO } from '../value-objects/email.vo';

@Injectable()
export class ValidateUserCredentialsUseCase {
  private readonly logger = new Logger(ValidateUserCredentialsUseCase.name);

  constructor(private readonly usersService: UsersService) {}

  async execute(email: string, password: string): Promise<any> {
    let emailVO: EmailVO;
    try {
      emailVO = new EmailVO(email);
    } catch {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const cleanPassword = (password || '').trim();
    this.logger.log(`[Auth] Tentativa de login: ${emailVO.value}`);

    const user = await this.usersService.findByEmail(emailVO.value);
    if (!user) {
      this.logger.warn(`[Auth] Usuário não encontrado: ${emailVO.value}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      this.logger.warn(`[Auth] Usuário inativo: ${emailVO.value}`);
      throw new UnauthorizedException('Usuário desativado');
    }

    const isPasswordValid = await PasswordVO.compare(cleanPassword, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`[Auth] Senha incorreta para: ${emailVO.value}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { password: _, ...result } = user;
    return result;
  }
}
