import { IsString, IsNotEmpty } from 'class-validator';

export class CreateXmlImportLogDto {
  @IsString()
  @IsNotEmpty()
  nfeKey: string;
}
