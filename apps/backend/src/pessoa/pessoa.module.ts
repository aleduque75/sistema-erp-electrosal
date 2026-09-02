import { Module } from '@nestjs/common';
import { PessoaController } from './pessoa.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaRepository } from './repositories/pessoa.repository';
import { PrismaPessoaRepository } from './repositories/prisma-pessoa.repository';
import { CreatePessoaUseCase } from './use-cases/create-pessoa.use-case';
import { UpdatePessoaUseCase } from './use-cases/update-pessoa.use-case';
import { ListPessoasUseCase } from './use-cases/list-pessoas.use-case';
import { GetPessoaUseCase } from './use-cases/get-pessoa.use-case';
import { DeletePessoaUseCase } from './use-cases/delete-pessoa.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [PessoaController],
  providers: [
    {
      provide: PessoaRepository,
      useClass: PrismaPessoaRepository,
    },
    {
      provide: 'IPessoaRepository',
      useClass: PrismaPessoaRepository,
    },
    CreatePessoaUseCase,
    UpdatePessoaUseCase,
    ListPessoasUseCase,
    GetPessoaUseCase,
    DeletePessoaUseCase,
  ],
  exports: [
    PessoaRepository,
    'IPessoaRepository',
    CreatePessoaUseCase,
    UpdatePessoaUseCase,
    ListPessoasUseCase,
    GetPessoaUseCase,
    DeletePessoaUseCase,
  ],
})
export class PessoaModule {}