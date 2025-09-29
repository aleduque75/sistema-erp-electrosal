import { MetalAccount, TipoMetal } from '@sistema-erp-electrosal/core';

export class MetalAccountResponseDto {
  id: string;
  personId: string;
  type: TipoMetal;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(metalAccount: MetalAccount): MetalAccountResponseDto {
    const dto = new MetalAccountResponseDto();
    dto.id = metalAccount.id.toString();
    dto.personId = metalAccount.personId;
    dto.type = metalAccount.type;
    dto.organizationId = metalAccount.organizationId;
    dto.createdAt = metalAccount.createdAt;
    dto.updatedAt = metalAccount.updatedAt;
    return dto;
  }

  static fromDomainArray(metalAccounts: MetalAccount[]): MetalAccountResponseDto[] {
    return metalAccounts.map(metalAccount => this.fromDomain(metalAccount));
  }
}
