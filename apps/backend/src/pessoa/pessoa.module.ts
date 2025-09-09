import { Module } from '@nestjs/common';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IPessoaRepository } from '@sistema-erp-electrosal/core'; // Assuming this path
import { PrismaPessoaRepository } from './repositories/prisma-pessoa.repository';

@Module({
  imports: [PrismaModule],
  controllers: [PessoaController],
  providers: [
    PessoaService,
    {
      provide: 'IPessoaRepository',
      useClass: PrismaPessoaRepository,
    },
  ],
  exports: [PessoaService, 'IPessoaRepository'],
})
export class PessoaModule {}