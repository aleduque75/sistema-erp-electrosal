import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly usersService: UsersService) {}

  async execute(userId: string, orgId: string) {
    const user = await this.usersService.findByIdAndOrganization(userId, orgId, {
      settings: true,
    });

    if (!user) {
      throw new NotFoundException(`Usuário não encontrado.`);
    }

    return user;
  }
}
