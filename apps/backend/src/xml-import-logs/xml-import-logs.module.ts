import { Module } from '@nestjs/common';
import { XmlImportLogsService } from './xml-import-logs.service';
import { XmlImportLogsController } from './xml-import-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [XmlImportLogsController],
  providers: [XmlImportLogsService],
  exports: [XmlImportLogsService], // Export the service so other modules can use it
})
export class XmlImportLogsModule {}
