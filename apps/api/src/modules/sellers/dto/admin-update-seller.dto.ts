import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class AdminUpdateSellerDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
