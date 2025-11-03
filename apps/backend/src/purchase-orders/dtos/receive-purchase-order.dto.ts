import { IsDateString, IsNotEmpty } from 'class-validator';

export class ReceivePurchaseOrderDto {
  @IsDateString()
  @IsNotEmpty()
  receivedAt: string;
}
