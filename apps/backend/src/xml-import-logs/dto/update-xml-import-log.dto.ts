import { PartialType } from '@nestjs/mapped-types';
import { CreateXmlImportLogDto } from './create-xml-import-log.dto';

export class UpdateXmlImportLogDto extends PartialType(CreateXmlImportLogDto) {}
