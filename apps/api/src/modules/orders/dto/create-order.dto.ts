import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be +998XXXXXXXXX' })
  contactPhone: string;

  @IsIn(['PAYME', 'CLICK', 'UZUM', 'CASH'])
  paymentMethod: 'PAYME' | 'CLICK' | 'UZUM' | 'CASH';

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  coinsUsed?: number;

  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @IsOptional()
  @IsString()
  giftMessage?: string;

  @IsOptional()
  @IsBoolean()
  giftWrapping?: boolean;

  @IsOptional()
  @IsBoolean()
  secretSender?: boolean;

  @IsEnum({ COURIER: 'COURIER', PICKUP: 'PICKUP', SCHEDULED: 'SCHEDULED', SECRET: 'SECRET' })
  @IsOptional()
  deliveryType?: 'COURIER' | 'PICKUP' | 'SCHEDULED' | 'SECRET';

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;
}
