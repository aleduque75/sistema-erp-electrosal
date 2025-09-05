import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateXmlImportLogDto } from './dto/create-xml-import-log.dto';
import { UpdateXmlImportLogDto } from './dto/update-xml-import-log.dto';
import { XmlImportLog } from '@sistema-beleza/core';
import { XmlImportLogMapper } from './mappers/xml-import-log.mapper';

@Injectable()
export class XmlImportLogsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createXmlImportLogDto: CreateXmlImportLogDto): Promise<XmlImportLog> {
    const newXmlImportLog = XmlImportLog.create({
      ...createXmlImportLogDto,
      organizationId,
    });
    const prismaXmlImportLog = await this.prisma.xmlImportLog.create({
      data: XmlImportLogMapper.toPersistence(newXmlImportLog),
    });
    return XmlImportLogMapper.toDomain(prismaXmlImportLog);
  }

  async findAll(organizationId: string): Promise<XmlImportLog[]> {
    const prismaXmlImportLogs = await this.prisma.xmlImportLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return prismaXmlImportLogs.map(XmlImportLogMapper.toDomain);
  }

  async findOne(organizationId: string, id: string): Promise<XmlImportLog> {
    const prismaXmlImportLog = await this.prisma.xmlImportLog.findFirst({
      where: { id, organizationId },
    });
    if (!prismaXmlImportLog) {
      throw new NotFoundException(`XmlImportLog with ID ${id} not found`);
    }
    return XmlImportLogMapper.toDomain(prismaXmlImportLog);
  }

  async findByNfeKey(organizationId: string, nfeKey: string): Promise<XmlImportLog | null> {
    const prismaXmlImportLog = await this.prisma.xmlImportLog.findUnique({
      where: { nfeKey },
    });
    if (!prismaXmlImportLog) {
      return null;
    }
    return XmlImportLogMapper.toDomain(prismaXmlImportLog);
  }

  async update(organizationId: string, id: string, updateXmlImportLogDto: UpdateXmlImportLogDto): Promise<XmlImportLog> {
    const existingXmlImportLog = await this.findOne(organizationId, id);
    existingXmlImportLog.update(updateXmlImportLogDto);
    
    const updatedPrismaXmlImportLog = await this.prisma.xmlImportLog.update({
      where: { id },
      data: XmlImportLogMapper.toPersistence(existingXmlImportLog),
    });
    return XmlImportLogMapper.toDomain(updatedPrismaXmlImportLog);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    await this.findOne(organizationId, id);
    await this.prisma.xmlImportLog.delete({
      where: { id },
    });
  }
}

