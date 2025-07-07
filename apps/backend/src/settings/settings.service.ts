// apps/backend/src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Busca as configurações do usuário, ou cria se não existirem
  async findOne(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  // Atualiza as configurações
  async update(userId: string, updateSettingDto: UpdateSettingDto) {
    const settings = await this.findOne(userId); // Garante que as configs existam
    return this.prisma.userSettings.update({
      where: { id: settings.id },
      data: updateSettingDto,
    });
  }
}
