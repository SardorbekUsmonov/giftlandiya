import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSellerDto {
  @IsString()
  @IsNotEmpty()
  sellerId: string;
}
