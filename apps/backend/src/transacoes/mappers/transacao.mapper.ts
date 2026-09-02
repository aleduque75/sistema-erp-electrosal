import { TransacaoEntity } from '../entities/transacao.entity';
import { Prisma, Transacao as PrismaTransacao } from '@prisma/client';

export type PrismaTransacaoWithRelations = PrismaTransacao & {
  medias?: any[];
  contaContabil?: any;
  contaCorrente?: any;
  fornecedor?: any;
};

export class TransacaoMapper {
  static toDomain(raw: PrismaTransacaoWithRelations): TransacaoEntity {
    return TransacaoEntity.create({
      id: raw.id,
      tipo: raw.tipo,
      valor: raw.valor ? Number(raw.valor) : 0,
      moeda: raw.moeda,
      descricao: raw.descricao,
      dataHora: raw.dataHora,
      contaContabilId: raw.contaContabilId,
      contaCorrenteId: raw.contaCorrenteId,
      organizationId: raw.organizationId,
      goldAmount: raw.goldAmount ? Number(raw.goldAmount) : null,
      goldPrice: raw.goldPrice ? Number(raw.goldPrice) : null,
      status: raw.status,
      fitId: raw.fitId,
      accountRecId: raw.accountRecId,
      linkedTransactionId: raw.linkedTransactionId,
      fornecedorId: raw.fornecedorId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      medias: raw.medias || [],
      contaContabil: raw.contaContabil,
      contaCorrente: raw.contaCorrente,
      fornecedor: raw.fornecedor,
    });
  }

  static toPersistence(entity: TransacaoEntity): Prisma.TransacaoUncheckedCreateInput {
    return {
      id: entity.id,
      tipo: entity.tipo.value,
      valor: new Prisma.Decimal(entity.valor),
      moeda: entity.moeda,
      descricao: entity.descricao ?? null,
      dataHora: entity.dataHora,
      contaContabilId: entity.contaContabilId,
      contaCorrenteId: entity.contaCorrenteId ?? null,
      organizationId: entity.organizationId,
      goldAmount: entity.goldAmount !== null && entity.goldAmount !== undefined ? new Prisma.Decimal(entity.goldAmount) : null,
      goldPrice: entity.goldPrice !== null && entity.goldPrice !== undefined ? new Prisma.Decimal(entity.goldPrice) : null,
      status: entity.status.value,
      fitId: entity.fitId ?? null,
      accountRecId: entity.accountRecId ?? null,
      linkedTransactionId: entity.linkedTransactionId ?? null,
      fornecedorId: entity.fornecedorId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseDto(entity: TransacaoEntity): Record<string, any> {
    return {
      id: entity.id,
      tipo: entity.tipo.value,
      valor: entity.valor,
      moeda: entity.moeda,
      descricao: entity.descricao,
      dataHora: entity.dataHora,
      contaContabilId: entity.contaContabilId,
      contaCorrenteId: entity.contaCorrenteId,
      organizationId: entity.organizationId,
      goldAmount: entity.goldAmount,
      goldPrice: entity.goldPrice,
      status: entity.status.value,
      fitId: entity.fitId,
      accountRecId: entity.accountRecId,
      linkedTransactionId: entity.linkedTransactionId,
      fornecedorId: entity.fornecedorId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      medias: entity.medias,
      contaContabil: entity.contaContabil,
      contaCorrente: entity.contaCorrente,
      fornecedor: entity.fornecedor,
    };
  }
}
