import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LoginUserUseCase {
  constructor(private readonly jwtService: JwtService) {}

  async execute(user: { id: string; email: string; organizationId: string }): Promise<{ access_token: string }> {
    const payload = {
      email: user.email,
      sub: user.id,
      orgId: user.organizationId,
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}
