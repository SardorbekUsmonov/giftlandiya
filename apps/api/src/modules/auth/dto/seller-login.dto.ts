import { IsString, MinLength, Matches } from 'class-validator';

export class SellerLoginDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be +998XXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
