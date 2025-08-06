import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class ImportXmlDto {
  @IsString()
  @IsNotEmpty()
  readonly xmlContent: string;
}

export class ConfirmImportXmlDto {
  @IsString()
  @IsNotEmpty()
  xmlContent: string;

  @IsObject()
  @IsOptional()
  manualMatches?: Record<string, string>;
}