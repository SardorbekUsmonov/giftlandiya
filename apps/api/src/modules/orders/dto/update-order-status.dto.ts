import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['NEW', 'CONFIRMED', 'PACKING', 'READY', 'ON_COURIER', 'DELIVERED', 'RETURNED', 'CANCELLED'])
  status: string;
}
