import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateGiftCalendarDto {
  @IsString()
  @MinLength(1)
  personName: string;

  @IsString()
  @MinLength(1)
  eventType: string;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;
}
