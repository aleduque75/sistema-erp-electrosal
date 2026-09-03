import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { RegisterUserDto } from '../dtos/auth.dto';
import { EmailVO } from '../value-objects/email.vo';
import { PasswordVO } from '../value-objects/password.vo';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ access_token: string }> {
    const emailVO = new EmailVO(dto.email);
    const passwordVO = new PasswordVO(dto.password);

    const existingUser = await this.usersService.findByEmail(emailVO.value);
    if (existingUser) {
      throw new BadRequestException('Usuário com este e-mail já existe');
    }

    const hashedPassword = await passwordVO.hash();
    const user = await this.usersService.create({
      email: emailVO.value,
      password: hashedPassword,
      name: dto.name,
    });

    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}
