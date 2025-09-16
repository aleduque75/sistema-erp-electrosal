import { ContaMetal, TipoMetal } from '@sistema-erp-electrosal/core';

export class ContaMetalResponseDto {
  id: string;
  organizationId: string;
  name: string;
  metalType: TipoMetal;
  balance: number;
  dataCriacao: Date;
  dataAtualizacao: Date;

  static fromDomain(contaMetal: ContaMetal): ContaMetalResponseDto {
    const dto = new ContaMetalResponseDto();
    dto.id = contaMetal.id.toString();
    dto.organizationId = contaMetal.organizationId;
    dto.name = contaMetal.name;
    dto.metalType = contaMetal.metalType;
    dto.balance = contaMetal.balance;
    dto.dataCriacao = contaMetal.dataCriacao;
    dto.dataAtualizacao = contaMetal.dataAtualizacao;
    return dto;
  }

  static fromDomainArray(contasMetais: ContaMetal[]): ContaMetalResponseDto[] {
    return contasMetais.map(contaMetal => this.fromDomain(contaMetal));
  }
}
