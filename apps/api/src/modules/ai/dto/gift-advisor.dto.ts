import { IsString, MinLength } from 'class-validator';

export class GiftAdvisorDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsString()
  @MinLength(1)
  sessionId: string;
}
