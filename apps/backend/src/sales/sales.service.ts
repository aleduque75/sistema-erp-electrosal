import { Inject, Injectable } from '@nestjs/common';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { ISaleRepository } from '@sistema-beleza/core';

@Injectable()
export class SalesService {
  // ✅ CORRIGIDO: Injetando o ISaleRepository
  constructor(
    @Inject(ISaleRepository)
    private readonly saleRepository: ISaleRepository,
  ) {}

  findAll(userId: string) {
    return this.saleRepository.findAll(userId);
  }

  findOne(userId: string, id: string) {
    // Adicionar lógica para garantir que a venda pertence ao usuário
    return this.saleRepository.findById(id);
  }

  update(userId: string, id: string, updateSaleDto: UpdateSaleDto) {
    // Adicionar lógica de atualização e validação
    return `This action updates a #${id} sale`;
  }

  remove(userId: string, id: string) {
    // Adicionar lógica de remoção
    return `This action removes a #${id} sale`;
  }
}
