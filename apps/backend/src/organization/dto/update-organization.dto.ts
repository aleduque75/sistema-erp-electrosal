import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateOrganizationDto {
  @IsUUID()
  @IsOptional()
  sidebarLogoImageId?: string;
}
