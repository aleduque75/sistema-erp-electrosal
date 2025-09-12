import { XmlImportLog, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { XmlImportLog as PrismaXmlImportLog } from '@prisma/client';

export class XmlImportLogMapper {
  static toDomain(raw: PrismaXmlImportLog): XmlImportLog {
    return XmlImportLog.create(
      {
        organizationId: raw.organizationId,
        nfeKey: raw.nfeKey,
        createdAt: raw.createdAt,
      },
      raw.id ? UniqueEntityID.create(raw.id) : undefined,
    );
  }

  static toPersistence(xmlImportLog: XmlImportLog): PrismaXmlImportLog {
    return {
      id: xmlImportLog.id.toString(),
      organizationId: xmlImportLog.organizationId,
      nfeKey: xmlImportLog.nfeKey,
      createdAt: xmlImportLog.createdAt,
    } as PrismaXmlImportLog; // Cast to PrismaXmlImportLog to satisfy type checking
  }
}
