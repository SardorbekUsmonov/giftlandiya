import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class ValidatePromoDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsInt()
  @Min(0)
  subtotal: number;
}
