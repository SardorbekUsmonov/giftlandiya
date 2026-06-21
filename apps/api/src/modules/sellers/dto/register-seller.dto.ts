import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterSellerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shopName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
