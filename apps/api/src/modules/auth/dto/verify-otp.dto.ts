import { IsNumberString, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be +998XXXXXXXXX' })
  phone: string;

  @IsString()
  @Length(6, 6)
  @IsNumberString()
  otp: string;
}
