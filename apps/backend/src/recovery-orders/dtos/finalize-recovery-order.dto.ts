import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class FinalizeRecoveryOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  teorFinal: number;
}

