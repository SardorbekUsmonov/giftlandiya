import { IsString, MinLength } from 'class-validator';

export class ResetSellerPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}
