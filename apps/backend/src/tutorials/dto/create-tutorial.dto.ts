import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTutorialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
