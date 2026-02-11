import { IsArray, IsUUID } from 'class-validator';

export class BulkCreateFromTransactionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds: string[];
}
