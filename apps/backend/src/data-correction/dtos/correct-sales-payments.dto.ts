import { IsNotEmpty, IsNumberString } from 'class-validator';

export class CorrectSalesPaymentsDto {
  @IsNumberString()
  @IsNotEmpty()
  startOrderNumber: string;
}
