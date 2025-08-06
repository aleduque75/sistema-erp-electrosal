import { IsBoolean } from 'class-validator';

export class UpdateOrganizationSettingDto {
  @IsBoolean()
  absorbCreditCardFee: boolean;
}
